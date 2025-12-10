import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Charge, Payment, ChargeStatus, AppData, PaymentMethod } from "@/types";
import { useAuth } from "./AuthContext";
import { getDb, isFirestoreAvailable, getFirestoreError } from "@/config/firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  Timestamp
} from "firebase/firestore";

export interface PaymentOptions {
  paymentMethod?: PaymentMethod;
  paymentProof?: string;
  notes?: string;
}

const STORAGE_KEY = "@lastro_capital_data";
const UNDO_KEY = "@lastro_capital_undo";

function getStorageKeyForUser(userId: string): string {
  return `${STORAGE_KEY}_${userId}`;
}

function getUndoKeyForUser(userId: string): string {
  return `${UNDO_KEY}_${userId}`;
}

interface DataContextType {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
  isLoading: boolean;
  canUndo: boolean;
  isCloudSynced: boolean;
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  toggleArchiveClient: (id: string) => Promise<void>;
  addCharge: (charge: Omit<Charge, "id" | "createdAt">) => Promise<Charge>;
  updateCharge: (id: string, charge: Partial<Charge>) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  markAsPaid: (chargeId: string, options?: PaymentOptions) => Promise<void>;
  payMonthlyInterest: (chargeId: string, options?: PaymentOptions) => Promise<void>;
  payDelayFee: (chargeId: string, options?: PaymentOptions) => Promise<void>;
  undo: () => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  getChargeById: (id: string) => Charge | undefined;
  getChargesByClient: (clientId: string) => Charge[];
  getPendingTotal: () => number;
  getPaidTotal: () => number;
  getInterestPaidThisMonth: () => number;
  getTotalDelayFees: () => number;
  getOverdueCharges: () => Charge[];
  getUpcomingCharges: (days: number) => Charge[];
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function checkOverdue(charges: Charge[]): Charge[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return charges.map((charge) => {
    if (charge.status === "pending" || charge.status === "overdue") {
      const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
      referenceDate.setHours(0, 0, 0, 0);
      
      const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyInterestAmount = (charge.loanPercentage || 0) / 100 * charge.amount;
      
      if (daysOverdue >= 1) {
        const monthsOverdue = Math.max(1, Math.ceil(daysOverdue / 30));
        const totalAccumulatedInterest = monthlyInterestAmount * monthsOverdue;
        return { 
          ...charge, 
          status: "overdue" as ChargeStatus,
          accumulatedInterest: totalAccumulatedInterest
        };
      } else {
        return { ...charge, accumulatedInterest: 0 };
      }
    }
    return charge;
  });
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [useFirestore, setUseFirestore] = useState(false);

  const userId = user?.id || "";

  useEffect(() => {
    const checkFirestore = async () => {
      try {
        const available = isFirestoreAvailable();
        console.log("Firestore available:", available);
        if (!available) {
          const error = getFirestoreError();
          console.log("Firestore error:", error?.message);
        }
        setUseFirestore(available);
      } catch (error) {
        console.log("Error checking Firestore:", error);
        setUseFirestore(false);
      }
    };
    checkFirestore();
  }, []);

  const saveToFirestore = useCallback(async (data: AppData) => {
    if (!userId || !useFirestore) return false;
    
    try {
      const db = getDb();
      if (!db) return false;

      const batch = writeBatch(db);

      for (const client of data.clients) {
        const clientRef = doc(db, `users/${userId}/clients`, client.id);
        batch.set(clientRef, client);
      }

      for (const charge of data.charges) {
        const chargeRef = doc(db, `users/${userId}/charges`, charge.id);
        batch.set(chargeRef, charge);
      }

      for (const payment of data.payments) {
        const paymentRef = doc(db, `users/${userId}/payments`, payment.id);
        batch.set(paymentRef, payment);
      }

      await batch.commit();
      console.log("Data saved to Firestore");
      setIsCloudSynced(true);
      return true;
    } catch (error) {
      console.error("Error saving to Firestore:", error);
      return false;
    }
  }, [userId, useFirestore]);

  const loadFromFirestore = useCallback(async (): Promise<AppData | null> => {
    if (!userId || !useFirestore) return null;
    
    try {
      const db = getDb();
      if (!db) return null;

      const clientsSnapshot = await getDocs(collection(db, `users/${userId}/clients`));
      const chargesSnapshot = await getDocs(collection(db, `users/${userId}/charges`));
      const paymentsSnapshot = await getDocs(collection(db, `users/${userId}/payments`));

      const loadedClients: Client[] = [];
      const loadedCharges: Charge[] = [];
      const loadedPayments: Payment[] = [];

      clientsSnapshot.forEach((doc) => {
        loadedClients.push(doc.data() as Client);
      });

      chargesSnapshot.forEach((doc) => {
        loadedCharges.push(doc.data() as Charge);
      });

      paymentsSnapshot.forEach((doc) => {
        loadedPayments.push(doc.data() as Payment);
      });

      console.log("Data loaded from Firestore:", {
        clients: loadedClients.length,
        charges: loadedCharges.length,
        payments: loadedPayments.length
      });

      setIsCloudSynced(true);
      return {
        clients: loadedClients,
        charges: loadedCharges,
        payments: loadedPayments
      };
    } catch (error) {
      console.error("Error loading from Firestore:", error);
      return null;
    }
  }, [userId, useFirestore]);

  const saveToLocal = useCallback(async (data: AppData) => {
    try {
      if (!userId) return;
      const key = getStorageKeyForUser(userId);
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to local:", error);
    }
  }, [userId]);

  const loadFromLocal = useCallback(async (): Promise<AppData | null> => {
    try {
      if (!userId) return null;

      const key = getStorageKeyForUser(userId);
      let storedData = await AsyncStorage.getItem(key);
      
      if (!storedData) {
        const oldData = await AsyncStorage.getItem(STORAGE_KEY);
        if (oldData) {
          console.log("Migrating data from old format...");
          storedData = oldData;
          await AsyncStorage.setItem(key, oldData);
        }
      }
      
      if (storedData) {
        return JSON.parse(storedData);
      }
      
      return null;
    } catch (error) {
      console.error("Error loading from local:", error);
      return null;
    }
  }, [userId]);

  const saveData = useCallback(async (data: AppData) => {
    await saveToLocal(data);
    
    if (useFirestore) {
      await saveToFirestore(data);
    }
  }, [saveToLocal, saveToFirestore, useFirestore]);

  const saveUndoSnapshot = useCallback(async (data: AppData) => {
    try {
      if (!userId) return;
      const key = getUndoKeyForUser(userId);
      await AsyncStorage.setItem(key, JSON.stringify(data));
      setCanUndo(true);
    } catch (error) {
      console.error("Error saving undo snapshot:", error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!userId) {
        setClients([]);
        setCharges([]);
        setPayments([]);
        return;
      }

      let data: AppData | null = null;

      if (useFirestore) {
        data = await loadFromFirestore();
      }

      if (!data || (data.clients.length === 0 && data.charges.length === 0)) {
        const localData = await loadFromLocal();
        if (localData) {
          data = localData;
          
          if (useFirestore && (localData.clients.length > 0 || localData.charges.length > 0)) {
            console.log("Migrating local data to cloud...");
            await saveToFirestore(localData);
          }
        }
      }

      if (data) {
        setClients(data.clients || []);
        setCharges(checkOverdue(data.charges || []));
        setPayments(data.payments || []);
      } else {
        console.log("No data found for user:", userId);
        setClients([]);
        setCharges([]);
        setPayments([]);
      }
      
      const undoKey = getUndoKeyForUser(userId);
      const undoData = await AsyncStorage.getItem(undoKey);
      setCanUndo(!!undoData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, useFirestore, loadFromFirestore, loadFromLocal, saveToFirestore]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading && userId) {
      const updatedCharges = checkOverdue(charges);
      saveData({ clients, charges: updatedCharges, payments });
    }
  }, [clients, charges, payments, isLoading, saveData, userId]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const addClient = useCallback(async (clientData: Omit<Client, "id" | "createdAt">): Promise<Client> => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    setClients((prev) =>
      prev.map((client) => (client.id === id ? { ...client, ...clientData } : client))
    );
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const updatedClients = clients.filter((client) => client.id !== id);
    const updatedCharges = charges.filter((charge) => charge.clientId !== id);
    const updatedPayments = payments.filter((payment) => {
      const chargesForClient = charges.filter((c) => c.clientId === id);
      return !chargesForClient.some((c) => c.id === payment.chargeId);
    });

    if (useFirestore && userId) {
      try {
        const db = getDb();
        if (db) {
          await deleteDoc(doc(db, `users/${userId}/clients`, id));
          
          const chargesToDelete = charges.filter((c) => c.clientId === id);
          for (const charge of chargesToDelete) {
            await deleteDoc(doc(db, `users/${userId}/charges`, charge.id));
          }
        }
      } catch (error) {
        console.error("Error deleting from Firestore:", error);
      }
    }

    const appData: AppData = { clients: updatedClients, charges: updatedCharges, payments: updatedPayments };
    await saveToLocal(appData);

    setClients(updatedClients);
    setCharges(updatedCharges);
    setPayments(updatedPayments);
  }, [clients, charges, payments, saveToLocal, useFirestore, userId]);

  const toggleArchiveClient = useCallback(async (id: string) => {
    setClients((prev) =>
      prev.map((client) => 
        client.id === id ? { ...client, archived: !client.archived } : client
      )
    );
  }, []);

  const addCharge = useCallback(async (chargeData: Omit<Charge, "id" | "createdAt">): Promise<Charge> => {
    const newCharge: Charge = {
      ...chargeData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setCharges((prev) => checkOverdue([...prev, newCharge]));
    return newCharge;
  }, []);

  const updateCharge = useCallback(async (id: string, chargeData: Partial<Charge>) => {
    setCharges((prev) =>
      checkOverdue(prev.map((charge) => (charge.id === id ? { ...charge, ...chargeData } : charge)))
    );
  }, []);

  const deleteCharge = useCallback(async (id: string) => {
    const updatedCharges = charges.filter((charge) => charge.id !== id);
    const updatedPayments = payments.filter((payment) => payment.chargeId !== id);

    if (useFirestore && userId) {
      try {
        const db = getDb();
        if (db) {
          await deleteDoc(doc(db, `users/${userId}/charges`, id));
        }
      } catch (error) {
        console.error("Error deleting charge from Firestore:", error);
      }
    }

    const appData: AppData = { clients, charges: updatedCharges, payments: updatedPayments };
    await saveToLocal(appData);

    setCharges(updatedCharges);
    setPayments(updatedPayments);
  }, [charges, payments, clients, saveToLocal, useFirestore, userId]);

  const markAsPaid = useCallback(async (chargeId: string, options: PaymentOptions = {}) => {
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    const paidDate = new Date().toISOString();

    const updatedCharges = charges.map((c) =>
      c.id === chargeId ? { ...c, status: "paid" as ChargeStatus, paidDate } : c
    );
    setCharges(updatedCharges);

    const payment: Payment = {
      id: generateId(),
      chargeId,
      clientId: charge.clientId,
      amount: charge.amount,
      paidAt: paidDate,
      notes: options.notes || "Quitacao de divida",
      paymentMethod: options.paymentMethod,
      paymentProof: options.paymentProof,
    };

    const updatedPayments = [...payments, payment];
    setPayments(updatedPayments);

    const appData: AppData = { clients, charges: updatedCharges, payments: updatedPayments };
    await saveData(appData);
  }, [charges, payments, clients, saveData]);

  const payMonthlyInterest = useCallback(async (chargeId: string, options: PaymentOptions = {}) => {
    const today = new Date().toISOString().split('T')[0];
    
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    const monthlyInterestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    
    const baseDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const nextInterestDate = new Date(baseDate);
    nextInterestDate.setMonth(nextInterestDate.getMonth() + 1);
    const nextDueDateStr = nextInterestDate.toISOString().split('T')[0];

    const currentInstallmentsPaid = charge.interestInstallmentsPaid || 0;
    
    const updated = charges.map((c) => 
      c.id === chargeId 
        ? { 
            ...c, 
            lastInterestPaymentDate: today,
            nextInterestDueDate: nextDueDateStr,
            interestInstallmentsPaid: currentInstallmentsPaid + 1,
            accumulatedInterest: 0
          }
        : c
    );
    
    const checkedUpdated = checkOverdue(updated);
    setCharges(checkedUpdated);

    if (monthlyInterestPerInstallment > 0) {
      const interestPayment: Payment = {
        id: generateId(),
        chargeId,
        clientId: charge.clientId,
        amount: monthlyInterestPerInstallment,
        paidAt: new Date().toISOString(),
        dueDate: baseDate.toISOString().split('T')[0],
        notes: options.notes || `Pagamento de juros - Parcela ${currentInstallmentsPaid + 1}`,
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
        type: "interest",
      };

      const updatedPayments = [...payments, interestPayment];

      const appData: AppData = { clients, charges: checkedUpdated, payments: updatedPayments };
      await saveData(appData);

      setPayments(updatedPayments);
    } else {
      const appData: AppData = { clients, charges: checkedUpdated, payments };
      await saveData(appData);
    }
  }, [charges, payments, clients, saveData]);

  const payDelayFee = useCallback(async (chargeId: string, options: PaymentOptions = {}) => {
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    const dueDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const delayFeeAlreadyPaid = payments
      .filter((p) => p.chargeId === chargeId && p.notes?.includes("taxa de atraso"))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const dailyRate = charge.dailyDelayRate || 0;
    const daysPaidSoFar = dailyRate > 0 ? Math.floor(delayFeeAlreadyPaid / dailyRate) : 0;
    const daysRemainingToPay = Math.max(0, daysOverdue - daysPaidSoFar);
    
    const daysPerInstallment = 30;
    const delayFeeInstallment = Math.min(daysPerInstallment, daysRemainingToPay) * dailyRate;

    if (delayFeeInstallment > 0) {
      const delayFeePayment: Payment = {
        id: generateId(),
        chargeId,
        clientId: charge.clientId,
        amount: delayFeeInstallment,
        paidAt: new Date().toISOString(),
        notes: options.notes || "Pagamento de taxa de atraso",
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
      };

      const updatedPayments = [...payments, delayFeePayment];
      const appData: AppData = { clients, charges, payments: updatedPayments };
      await saveData(appData);
      setPayments(updatedPayments);
    }
  }, [charges, payments, clients, saveData]);

  const undo = useCallback(async () => {
    try {
      if (!userId) return;
      const undoKey = getUndoKeyForUser(userId);
      const undoData = await AsyncStorage.getItem(undoKey);
      if (undoData) {
        const data: AppData = JSON.parse(undoData);
        setClients(data.clients || []);
        setCharges(checkOverdue(data.charges || []));
        setPayments(data.payments || []);
        await AsyncStorage.removeItem(undoKey);
        setCanUndo(false);
      }
    } catch (error) {
      console.error("Error undoing:", error);
    }
  }, [userId]);

  const getClientById = useCallback(
    (id: string) => clients.find((client) => client.id === id),
    [clients]
  );

  const getChargeById = useCallback(
    (id: string) => charges.find((charge) => charge.id === id),
    [charges]
  );

  const getChargesByClient = useCallback(
    (clientId: string) => charges.filter((charge) => charge.clientId === clientId),
    [charges]
  );

  const getPendingTotal = useCallback(() => {
    return charges
      .filter((c) => c.status === "pending" || c.status === "overdue")
      .reduce((sum, c) => sum + (c.accumulatedInterest || 0), 0);
  }, [charges]);

  const getPaidTotal = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return payments
      .filter((p) => new Date(p.paidAt) >= startOfMonth)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const getInterestPaidThisMonth = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const result = payments
      .filter((p) => 
        new Date(p.paidAt) >= startOfMonth && 
        p.notes === "Pagamento de juros mensais"
      )
      .reduce((sum, p) => sum + p.amount, 0);
    
    console.log("Calculating interest paid this month:", {
      totalPayments: payments.length,
      filteredPayments: payments.filter((p) => new Date(p.paidAt) >= startOfMonth && p.notes === "Pagamento de juros mensais").length,
      result
    });
    
    return result;
  }, [payments]);

  const getTotalDelayFees = useCallback(() => {
    const today = new Date();
    const totalDelayFees = charges
      .filter((c) => c.status === "pending" || c.status === "overdue")
      .reduce((sum, c) => {
        const dueDate = new Date(c.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const delayFee = daysOverdue > 0 && c.dailyDelayRate 
          ? c.dailyDelayRate * daysOverdue 
          : 0;
        return sum + delayFee;
      }, 0);
    
    return totalDelayFees;
  }, [charges]);

  const getOverdueCharges = useCallback(() => {
    const today = new Date();
    return charges.filter((c) => {
      if (c.status !== "pending" && c.status !== "overdue") return false;
      
      const dueDate = new Date(c.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const delayFeeAlreadyPaid = payments
        .filter((p) => p.chargeId === c.id && p.notes === "Pagamento de taxa de atraso")
        .reduce((sum, p) => sum + p.amount, 0);
      
      const delayFee = daysOverdue > 0 && c.dailyDelayRate 
        ? c.dailyDelayRate * daysOverdue 
        : 0;
      
      const pendingDelayFee = Math.max(0, delayFee - delayFeeAlreadyPaid);
      
      const interestDueDate = c.nextInterestDueDate ? new Date(c.nextInterestDueDate) : null;
      const interestDaysOverdue = interestDueDate
        ? Math.floor((today.getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const hasInterestDelay = interestDaysOverdue >= 1;
      
      return hasInterestDelay;
    });
  }, [charges, payments]);

  const getUpcomingCharges = useCallback(
    (days: number) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + days);

      return charges
        .filter((c) => {
          if (c.status !== "pending") return false;
          const dueDate = new Date(c.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= futureDate;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    },
    [charges]
  );

  return (
    <DataContext.Provider
      value={{
        clients,
        charges,
        payments,
        isLoading,
        canUndo,
        isCloudSynced,
        addClient,
        updateClient,
        deleteClient,
        toggleArchiveClient,
        addCharge,
        updateCharge,
        deleteCharge,
        markAsPaid,
        payMonthlyInterest,
        payDelayFee,
        undo,
        getClientById,
        getChargeById,
        getChargesByClient,
        getPendingTotal,
        getPaidTotal,
        getInterestPaidThisMonth,
        getTotalDelayFees,
        getOverdueCharges,
        getUpcomingCharges,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
