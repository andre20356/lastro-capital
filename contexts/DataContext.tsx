import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Charge, Payment, ChargeStatus, AppData, PaymentMethod } from "@/types";
import { useAuth } from "./AuthContext";
import { firebaseDataService } from "@/services/firebaseDataService";

export interface PaymentOptions {
  paymentMethod?: PaymentMethod;
  paymentProof?: string;
  notes?: string;
}

const STORAGE_KEY = "@lastro_capital_data";
const MIGRATION_KEY = "@lastro_capital_migrated";
const UNDO_KEY = "@lastro_capital_undo";

function getStorageKeyForUser(userId: string): string {
  return `${STORAGE_KEY}_${userId}`;
}

function getUndoKeyForUser(userId: string): string {
  return `${UNDO_KEY}_${userId}`;
}

function getMigrationKeyForUser(userId: string): string {
  return `${MIGRATION_KEY}_${userId}`;
}

interface DataContextType {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
  isLoading: boolean;
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

function checkOverdue(charges: Charge[]): Charge[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return charges.map((charge) => {
    if (charge.status === "pending" || charge.status === "overdue") {
      const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
      referenceDate.setHours(0, 0, 0, 0);
      
      const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyInterestAmount = (charge.loanPercentage || 0) / 100 * charge.amount;
      const dailyInterestAmount = monthlyInterestAmount / 30;
      
      if (daysOverdue >= 1) {
        const totalAccumulatedInterest = dailyInterestAmount * daysOverdue;
        return { 
          ...charge, 
          status: "overdue" as ChargeStatus,
          accumulatedInterest: Math.max(totalAccumulatedInterest, charge.accumulatedInterest || 0)
        };
      } else {
        return charge;
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

  const userId = user?.id || "";

  const migrateLocalToCloud = useCallback(async () => {
    if (!userId) return false;
    
    try {
      const migrationKey = getMigrationKeyForUser(userId);
      const alreadyMigrated = await AsyncStorage.getItem(migrationKey);
      
      if (alreadyMigrated) {
        console.log("Data already migrated to cloud");
        return false;
      }
      
      const localKey = getStorageKeyForUser(userId);
      const localData = await AsyncStorage.getItem(localKey);
      
      if (!localData) {
        const oldData = await AsyncStorage.getItem(STORAGE_KEY);
        if (oldData) {
          const data: AppData = JSON.parse(oldData);
          if (data.clients.length > 0 || data.charges.length > 0 || data.payments.length > 0) {
            console.log("Migrating old format data to cloud...");
            await firebaseDataService.migrateFromLocal(userId, data);
            await AsyncStorage.setItem(migrationKey, new Date().toISOString());
            return true;
          }
        }
        await AsyncStorage.setItem(migrationKey, new Date().toISOString());
        return false;
      }
      
      const data: AppData = JSON.parse(localData);
      if (data.clients.length > 0 || data.charges.length > 0 || data.payments.length > 0) {
        console.log("Migrating local data to cloud...", {
          clients: data.clients.length,
          charges: data.charges.length,
          payments: data.payments.length
        });
        await firebaseDataService.migrateFromLocal(userId, data);
        await AsyncStorage.setItem(migrationKey, new Date().toISOString());
        console.log("Migration completed!");
        return true;
      }
      
      await AsyncStorage.setItem(migrationKey, new Date().toISOString());
      return false;
    } catch (error) {
      console.error("Error during migration:", error);
      return false;
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

      await migrateLocalToCloud();

      console.log("Loading data from Firebase...");
      const data = await firebaseDataService.getAllData(userId);
      
      setClients(data.clients || []);
      setCharges(checkOverdue(data.charges || []));
      setPayments(data.payments || []);
      
      console.log("Data loaded from Firebase:", {
        clients: data.clients.length,
        charges: data.charges.length,
        payments: data.payments.length
      });
    } catch (error) {
      console.error("Error loading data from Firebase:", error);
      setClients([]);
      setCharges([]);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, migrateLocalToCloud]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const addClient = useCallback(async (clientData: Omit<Client, "id" | "createdAt">): Promise<Client> => {
    const newClient = await firebaseDataService.addClient(userId, clientData);
    setClients((prev) => [...prev, newClient]);
    return newClient;
  }, [userId]);

  const updateClient = useCallback(async (id: string, clientData: Partial<Client>) => {
    await firebaseDataService.updateClient(id, clientData);
    setClients((prev) =>
      prev.map((client) => (client.id === id ? { ...client, ...clientData } : client))
    );
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    await firebaseDataService.deleteClientCascade(id, userId);
    
    setClients((prev) => prev.filter((client) => client.id !== id));
    setCharges((prev) => prev.filter((charge) => charge.clientId !== id));
    setPayments((prev) => {
      const clientChargeIds = charges.filter(c => c.clientId === id).map(c => c.id);
      return prev.filter((payment) => !clientChargeIds.includes(payment.chargeId));
    });
  }, [userId, charges]);

  const toggleArchiveClient = useCallback(async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      const newArchived = !client.archived;
      await firebaseDataService.updateClient(id, { archived: newArchived });
      setClients((prev) =>
        prev.map((c) => c.id === id ? { ...c, archived: newArchived } : c)
      );
    }
  }, [clients]);

  const addCharge = useCallback(async (chargeData: Omit<Charge, "id" | "createdAt">): Promise<Charge> => {
    const newCharge = await firebaseDataService.addCharge(userId, chargeData);
    setCharges((prev) => checkOverdue([...prev, newCharge]));
    return newCharge;
  }, [userId]);

  const updateCharge = useCallback(async (id: string, chargeData: Partial<Charge>) => {
    await firebaseDataService.updateCharge(id, chargeData);
    setCharges((prev) =>
      checkOverdue(prev.map((charge) => (charge.id === id ? { ...charge, ...chargeData } : charge)))
    );
  }, []);

  const deleteCharge = useCallback(async (id: string) => {
    await firebaseDataService.deleteChargeCascade(id);
    
    setCharges((prev) => prev.filter((charge) => charge.id !== id));
    setPayments((prev) => prev.filter((payment) => payment.chargeId !== id));
  }, []);

  const markAsPaid = useCallback(async (chargeId: string, options: PaymentOptions = {}) => {
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    const paidDate = new Date().toISOString();

    await firebaseDataService.updateCharge(chargeId, { 
      status: "paid" as ChargeStatus, 
      paidDate 
    });

    const payment: Omit<Payment, "id"> = {
      chargeId,
      clientId: charge.clientId,
      amount: charge.amount,
      paidAt: paidDate,
      notes: options.notes || "Quitacao de divida",
      paymentMethod: options.paymentMethod,
      paymentProof: options.paymentProof,
    };

    const newPayment = await firebaseDataService.addPayment(userId, payment);

    setCharges((prev) => prev.map((c) =>
      c.id === chargeId ? { ...c, status: "paid" as ChargeStatus, paidDate } : c
    ));
    setPayments((prev) => [...prev, newPayment]);
  }, [charges, userId]);

  const payMonthlyInterest = useCallback(async (chargeId: string, options: PaymentOptions = {}) => {
    const today = new Date().toISOString().split('T')[0];
    
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    const monthlyInterestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    
    const baseDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const nextInterestDate = new Date(baseDate);
    nextInterestDate.setMonth(nextInterestDate.getMonth() + 1);
    const nextDueDateStr = nextInterestDate.toISOString().split('T')[0];

    const accumulatedInterest = charge.accumulatedInterest || 0;
    const remainingAccumulatedInterest = Math.max(0, accumulatedInterest - monthlyInterestPerInstallment);

    const chargeUpdates = {
      lastInterestPaymentDate: today,
      nextInterestDueDate: nextDueDateStr,
      accumulatedInterest: remainingAccumulatedInterest
    };

    await firebaseDataService.updateCharge(chargeId, chargeUpdates);
    
    setCharges((prev) => prev.map((c) => 
      c.id === chargeId ? { ...c, ...chargeUpdates } : c
    ));

    if (monthlyInterestPerInstallment > 0) {
      const interestPayment: Omit<Payment, "id"> = {
        chargeId,
        clientId: charge.clientId,
        amount: monthlyInterestPerInstallment,
        paidAt: new Date().toISOString(),
        dueDate: baseDate.toISOString().split('T')[0],
        notes: options.notes || "Pagamento de juros mensais",
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
      };

      const newPayment = await firebaseDataService.addPayment(userId, interestPayment);
      setPayments((prev) => [...prev, newPayment]);
    }
  }, [charges, userId]);

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
      const delayFeePayment: Omit<Payment, "id"> = {
        chargeId,
        clientId: charge.clientId,
        amount: delayFeeInstallment,
        paidAt: new Date().toISOString(),
        notes: options.notes || "Pagamento de taxa de atraso",
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
      };

      const newPayment = await firebaseDataService.addPayment(userId, delayFeePayment);
      setPayments((prev) => [...prev, newPayment]);
    }
  }, [charges, payments, userId]);

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
