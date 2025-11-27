import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Charge, Payment, ChargeStatus, AppData } from "@/types";

const STORAGE_KEY = "@lastro_capital_data";

interface DataContextType {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
  isLoading: boolean;
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addCharge: (charge: Omit<Charge, "id" | "createdAt">) => Promise<Charge>;
  updateCharge: (id: string, charge: Partial<Charge>) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  markAsPaid: (chargeId: string, notes?: string) => Promise<void>;
  payMonthlyInterest: (chargeId: string) => void;
  getClientById: (id: string) => Client | undefined;
  getChargeById: (id: string) => Charge | undefined;
  getChargesByClient: (clientId: string) => Charge[];
  getPendingTotal: () => number;
  getPaidTotal: () => number;
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
      const dueDate = new Date(charge.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        // Calcular juros acumulados por dias de atraso
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthlyInterestAmount = (charge.loanPercentage || 0) / 100 * charge.amount;
        const dailyInterestAmount = monthlyInterestAmount / 30;
        const totalAccumulatedInterest = dailyInterestAmount * daysOverdue;
        
        return { 
          ...charge, 
          status: "overdue" as ChargeStatus,
          accumulatedInterest: Math.max(totalAccumulatedInterest, charge.accumulatedInterest || 0)
        };
      }
    }
    return charge;
  });
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveData = useCallback(async (data: AppData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: AppData = JSON.parse(storedData);
        setClients(data.clients || []);
        setCharges(checkOverdue(data.charges || []));
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading) {
      saveData({ clients, charges, payments });
    }
  }, [clients, charges, payments, isLoading, saveData]);

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

  const deleteClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((client) => client.id !== id));
    setCharges((prev) => prev.filter((charge) => charge.clientId !== id));
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

  const deleteCharge = useCallback((id: string) => {
    setCharges((prev) => {
      const updated = prev.filter((charge) => charge.id !== id);
      setPayments((prevPayments) => {
        const updatedPayments = prevPayments.filter((payment) => payment.chargeId !== id);
        // Save to AsyncStorage
        const appData: AppData = { clients, charges: updated, payments: updatedPayments };
        saveData(appData);
        return updatedPayments;
      });
      return updated;
    });
  }, [clients, saveData]);

  const markAsPaid = useCallback(async (chargeId: string, notes: string = "") => {
    // Encontrar a cobrança atual
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    // Atualizar charges
    const updatedCharges = charges.map((c) =>
      c.id === chargeId ? { ...c, status: "paid" as ChargeStatus } : c
    );
    setCharges(updatedCharges);

    // Criar pagamento
    const payment: Payment = {
      id: generateId(),
      chargeId,
      clientId: charge.clientId,
      amount: charge.amount,
      paidAt: new Date().toISOString(),
      notes,
    };

    // Atualizar payments
    const updatedPayments = [...payments, payment];
    setPayments(updatedPayments);

    // Salvar em AsyncStorage
    const appData: AppData = { clients, charges: updatedCharges, payments: updatedPayments };
    await saveData(appData);
  }, [charges, payments, clients, saveData]);

  const payMonthlyInterest = useCallback((chargeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nextDueDate = new Date();
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
    
    setCharges((prev) => {
      const updated = prev.map((c) => 
        c.id === chargeId 
          ? { 
              ...c, 
              lastInterestPaymentDate: today,
              nextInterestDueDate: nextDueDateStr,
              accumulatedInterest: 0
            }
          : c
      );
      
      // Save to AsyncStorage
      const appData: AppData = { clients, charges: updated, payments };
      saveData(appData);
      
      return updated;
    });
  }, [clients, payments, saveData]);

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

  const getOverdueCharges = useCallback(() => {
    return charges.filter((c) => c.status === "overdue");
  }, [charges]);

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
        addCharge,
        updateCharge,
        deleteCharge,
        markAsPaid,
        payMonthlyInterest,
        getClientById,
        getChargeById,
        getChargesByClient,
        getPendingTotal,
        getPaidTotal,
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
