import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Charge, Payment, ChargeStatus, AppData } from "@/types";

const STORAGE_KEY = "@lastro_capital_data";
const UNDO_KEY = "@lastro_capital_undo";

interface DataContextType {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
  isLoading: boolean;
  canUndo: boolean;
  addClient: (client: Omit<Client, "id" | "createdAt">) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  toggleArchiveClient: (id: string) => Promise<void>;
  addCharge: (charge: Omit<Charge, "id" | "createdAt">) => Promise<Charge>;
  updateCharge: (id: string, charge: Partial<Charge>) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  markAsPaid: (chargeId: string, notes?: string) => Promise<void>;
  payMonthlyInterest: (chargeId: string) => Promise<void>;
  payDelayFee: (chargeId: string) => Promise<void>;
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
      // Usar nextInterestDueDate se existir, senão usar dueDate
      const referenceDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
      referenceDate.setHours(0, 0, 0, 0);
      
      // Calcular atraso baseado na data de vencimento de juros
      const daysOverdue = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthlyInterestAmount = (charge.loanPercentage || 0) / 100 * charge.amount;
      const dailyInterestAmount = monthlyInterestAmount / 30;
      
      console.log(`checkOverdue: ${charge.id} - referenceDate: ${referenceDate.toISOString()}, today: ${today.toISOString()}, daysOverdue: ${daysOverdue}, status: ${charge.status}`);
      
      // Se passou 1+ dias do vencimento, marca como vencida e acumula juros
      if (daysOverdue >= 1) {
        const totalAccumulatedInterest = dailyInterestAmount * daysOverdue;
        console.log(`checkOverdue: ${charge.id} mudando para "overdue", interesse acumulado: ${totalAccumulatedInterest}`);
        return { 
          ...charge, 
          status: "overdue" as ChargeStatus,
          accumulatedInterest: Math.max(totalAccumulatedInterest, charge.accumulatedInterest || 0)
        };
      } else {
        // Se ainda não venceu (0 ou negativo), mantém como pending
        return charge;
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
  const [canUndo, setCanUndo] = useState(false);

  const saveData = useCallback(async (data: AppData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, []);

  const saveUndoSnapshot = useCallback(async (data: AppData) => {
    try {
      await AsyncStorage.setItem(UNDO_KEY, JSON.stringify(data));
      setCanUndo(true);
    } catch (error) {
      console.error("Error saving undo snapshot:", error);
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
      // Verificar se existe snapshot de undo
      const undoData = await AsyncStorage.getItem(UNDO_KEY);
      setCanUndo(!!undoData);
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
      // Sempre recalcular overdue antes de salvar para manter status atualizado
      const updatedCharges = checkOverdue(charges);
      saveData({ clients, charges: updatedCharges, payments });
    }
  }, [clients, charges, payments, isLoading, saveData]);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: AppData = JSON.parse(storedData);
        const updatedCharges = checkOverdue(data.charges || []);
        setClients(data.clients || []);
        setCharges(updatedCharges);
        setPayments(data.payments || []);
        // Salvar novamente com status atualizado
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          clients: data.clients || [], 
          charges: updatedCharges, 
          payments: data.payments || [] 
        }));
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    // Filtrar clientes e cobranças relacionadas
    const updatedClients = clients.filter((client) => client.id !== id);
    const updatedCharges = charges.filter((charge) => charge.clientId !== id);
    const updatedPayments = payments.filter((payment) => {
      // Remover pagamentos relacionados às cobranças do cliente
      const chargesForClient = charges.filter((c) => c.clientId === id);
      return !chargesForClient.some((c) => c.id === payment.chargeId);
    });

    // Salvar em AsyncStorage PRIMEIRO
    const appData: AppData = { clients: updatedClients, charges: updatedCharges, payments: updatedPayments };
    await saveData(appData);

    // Depois atualizar state
    setClients(updatedClients);
    setCharges(updatedCharges);
    setPayments(updatedPayments);
  }, [clients, charges, payments, saveData]);

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
    // Filtrar dados
    const updatedCharges = charges.filter((charge) => charge.id !== id);
    const updatedPayments = payments.filter((payment) => payment.chargeId !== id);

    // Salvar em AsyncStorage PRIMEIRO
    const appData: AppData = { clients, charges: updatedCharges, payments: updatedPayments };
    await saveData(appData);

    // Depois atualizar state
    setCharges(updatedCharges);
    setPayments(updatedPayments);
  }, [charges, payments, clients, saveData]);

  const markAsPaid = useCallback(async (chargeId: string, notes: string = "") => {
    // Encontrar a cobrança atual
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    // Data de quitação
    const paidDate = new Date().toISOString();

    // Atualizar charges com data de quitação
    const updatedCharges = charges.map((c) =>
      c.id === chargeId ? { ...c, status: "paid" as ChargeStatus, paidDate } : c
    );
    setCharges(updatedCharges);

    // Criar pagamento
    const payment: Payment = {
      id: generateId(),
      chargeId,
      clientId: charge.clientId,
      amount: charge.amount,
      paidAt: paidDate,
      notes,
    };

    // Atualizar payments
    const updatedPayments = [...payments, payment];
    setPayments(updatedPayments);

    // Salvar em AsyncStorage
    const appData: AppData = { clients, charges: updatedCharges, payments: updatedPayments };
    await saveData(appData);
  }, [charges, payments, clients, saveData]);

  const payMonthlyInterest = useCallback(async (chargeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Encontrar a cobrança para obter o valor dos juros
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    // Calcular juros mensais por parcela
    const monthlyInterestPerInstallment = charge.loanPercentage ? (charge.amount * charge.loanPercentage) / 100 : 0;
    
    // Se já tem nextInterestDueDate, usar como base. Senão, usar dueDate
    const baseDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const nextInterestDate = new Date(baseDate);
    nextInterestDate.setMonth(nextInterestDate.getMonth() + 1);
    const nextDueDateStr = nextInterestDate.toISOString().split('T')[0];

    // Pagar apenas 1 parcela de juros (descontar do accumulatedInterest)
    const accumulatedInterest = charge.accumulatedInterest || 0;
    const remainingAccumulatedInterest = Math.max(0, accumulatedInterest - monthlyInterestPerInstallment);
    
    console.log("Pagamento de juros - detalhes:", {
      chargeId,
      accumulatedInterest,
      monthlyInterestPerInstallment,
      remainingAccumulatedInterest,
      loanPercentage: charge.loanPercentage,
      amount: charge.amount
    });
    
    const updated = charges.map((c) => 
      c.id === chargeId 
        ? { 
            ...c, 
            lastInterestPaymentDate: today,
            nextInterestDueDate: nextDueDateStr,
            accumulatedInterest: remainingAccumulatedInterest
          }
        : c
    );
    
    setCharges(updated);

    // Criar pagamento apenas da parcela de juros
    if (monthlyInterestPerInstallment > 0) {
      const interestPayment: Payment = {
        id: generateId(),
        chargeId,
        clientId: charge.clientId,
        amount: monthlyInterestPerInstallment,
        paidAt: new Date().toISOString(),
        dueDate: baseDate.toISOString().split('T')[0],
        notes: "Pagamento de juros mensais",
      };

      const updatedPayments = [...payments, interestPayment];

      // Save to AsyncStorage
      const appData: AppData = { clients, charges: updated, payments: updatedPayments };
      await saveData(appData);

      setPayments(updatedPayments);
      console.log("Pagamento de juros criado:", interestPayment);
    } else {
      // Se não há juros, apenas salva as charges
      const appData: AppData = { clients, charges: updated, payments };
      await saveData(appData);
    }
  }, [charges, payments, clients, saveData]);

  const payDelayFee = useCallback(async (chargeId: string) => {
    const charge = charges.find((c) => c.id === chargeId);
    if (!charge) return;

    // Usar nextInterestDueDate se existir (após pagamentos de juros), senão usar dueDate
    const dueDate = charge.nextInterestDueDate ? new Date(charge.nextInterestDueDate) : new Date(charge.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcular quanto de taxa de atraso já foi pago (em dias)
    const delayFeeAlreadyPaid = payments
      .filter((p) => p.chargeId === chargeId && p.notes === "Pagamento de taxa de atraso")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const daysPaidSoFar = charge.dailyDelayRate > 0 ? Math.floor(delayFeeAlreadyPaid / charge.dailyDelayRate) : 0;
    const daysRemainingToPay = Math.max(0, daysOverdue - daysPaidSoFar);
    
    // Pagar apenas 1 parcela (30 dias)
    const daysPerInstallment = 30;
    const delayFeeInstallment = Math.min(daysPerInstallment, daysRemainingToPay) * charge.dailyDelayRate;

    if (delayFeeInstallment > 0) {
      const delayFeePayment: Payment = {
        id: generateId(),
        chargeId,
        clientId: charge.clientId,
        amount: delayFeeInstallment,
        paidAt: new Date().toISOString(),
        notes: "Pagamento de taxa de atraso",
      };

      const updatedPayments = [...payments, delayFeePayment];
      const appData: AppData = { clients, charges, payments: updatedPayments };
      await saveData(appData);
      setPayments(updatedPayments);
      console.log("Taxa de atraso paga (1 parcela):", delayFeePayment, "dias:", Math.min(daysPerInstallment, daysRemainingToPay));
    }
  }, [charges, payments, clients, saveData]);

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
      
      // Verificar se tem taxa de atraso pendente
      const dueDate = new Date(c.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const delayFeeAlreadyPaid = payments
        .filter((p) => p.chargeId === c.id && p.notes === "Pagamento de taxa de atraso")
        .reduce((sum, p) => sum + p.amount, 0);
      
      const delayFee = daysOverdue > 0 && c.dailyDelayRate 
        ? c.dailyDelayRate * daysOverdue 
        : 0;
      
      const pendingDelayFee = Math.max(0, delayFee - delayFeeAlreadyPaid);
      
      // Verificar se tem juros em atraso (1+ dias após vencimento)
      const interestDueDate = c.nextInterestDueDate ? new Date(c.nextInterestDueDate) : null;
      const interestDaysOverdue = interestDueDate
        ? Math.floor((today.getTime() - interestDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const hasInterestDelay = interestDaysOverdue >= 1;
      
      // Retornar true apenas se houver REAL atraso (1+ dias de juros)
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
