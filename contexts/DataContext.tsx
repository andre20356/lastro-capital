// =======================
// IMPORTS
// =======================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Client,
  Charge,
  Payment,
  ChargeStatus,
  AppData,
  PaymentMethod,
} from "@/types";
import { useAuth } from "./AuthContext";
import {
  getDb,
  isFirestoreAvailable,
  getFirestoreError,
} from "@/config/firebase";
import {
  doc,
  writeBatch,
} from "firebase/firestore";

// =======================
// TYPES
// =======================
export interface PaymentOptions {
  paymentMethod?: PaymentMethod;
  paymentProof?: string;
  notes?: string;
}

// =======================
// STORAGE KEYS
// =======================
const STORAGE_KEY = "@lastro_capital_data";
const UNDO_KEY = "@lastro_capital_undo";

const getStorageKeyForUser = (userId: string) =>
  `${STORAGE_KEY}_${userId}`;

// =======================
// CONTEXT
// =======================
const DataContext = createContext<any>(undefined);

// =======================
// HELPERS
// =======================
const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

const getBillingType = (charge: Charge) =>
  charge.billingType ?? "monthly";

// =======================
// JUROS / ATRASO
// =======================
function checkOverdue(charges: Charge[]): Charge[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return charges.map((charge) => {
    if (charge.status === "paid") return charge;

    const refDate = charge.nextInterestDueDate
      ? new Date(charge.nextInterestDueDate)
      : new Date(charge.dueDate);

    refDate.setHours(0, 0, 0, 0);

    const daysOverdue = Math.floor(
      (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) {
      return { ...charge, accumulatedInterest: 0 };
    }

    const billingType = getBillingType(charge);
    const rate = (charge.loanPercentage || 0) / 100;

    let periods = 1;
    if (billingType === "monthly") periods = Math.ceil(daysOverdue / 30);
    if (billingType === "weekly") periods = Math.ceil(daysOverdue / 7);
    if (billingType === "daily") periods = daysOverdue;

    return {
      ...charge,
      status: "overdue" as ChargeStatus,
      accumulatedInterest: charge.amount * rate * periods,
    };
  });
}

// =======================
// PROVIDER
// =======================
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || "";

  const [clients, setClients] = useState<Client[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canUndo] = useState(false);
  const [useFirestore, setUseFirestore] = useState(false);

  // =======================
  // FIRESTORE CHECK
  // =======================
  useEffect(() => {
    const checkFirestore = async () => {
      const available = isFirestoreAvailable();
      setUseFirestore(available);
      if (!available) {
        console.log(getFirestoreError()?.message);
      }
    };
    checkFirestore();
  }, []);

  // =======================
  // SAVE DATA
  // =======================
  const saveData = useCallback(
    async (data: AppData) => {
      if (!userId) return;

      await AsyncStorage.setItem(
        getStorageKeyForUser(userId),
        JSON.stringify(data)
      );

      if (useFirestore) {
        const db = getDb();
        if (!db) return;

        const batch = writeBatch(db);
        data.clients.forEach((c) =>
          batch.set(doc(db, `users/${userId}/clients`, c.id), c)
        );
        data.charges.forEach((c) =>
          batch.set(doc(db, `users/${userId}/charges`, c.id), c)
        );
        data.payments.forEach((p) =>
          batch.set(doc(db, `users/${userId}/payments`, p.id), p)
        );
        await batch.commit();
      }
    },
    [userId, useFirestore]
  );

  // =======================
  // LOAD DATA
  // =======================
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (!userId) return;

      const local = await AsyncStorage.getItem(
        getStorageKeyForUser(userId)
      );

      if (local) {
        const data: AppData = JSON.parse(local);
        setClients(data.clients || []);
        setCharges(checkOverdue(data.charges || []));
        setPayments(data.payments || []);
      }

      setIsLoading(false);
    })();
  }, [userId]);

  // =======================
  // TOTAL A RECEBER
  // =======================
  const getPendingTotal = useCallback(() => {
    return charges
      .filter((c) => c.status !== "paid")
      .reduce((sum, c) => {
        const principal = c.amount || 0;
        const interest = c.accumulatedInterest || 0;

        const days =
          Math.floor(
            (Date.now() - new Date(c.dueDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) || 0;

        const delayFee =
          days > 0 && c.dailyDelayRate
            ? c.dailyDelayRate * days
            : 0;

        return sum + principal + interest + delayFee;
      }, 0);
  }, [charges]);

  // =======================
  // PAGAR JUROS
  // =======================
  const payMonthlyInterest = useCallback(
    async (chargeId: string, options: PaymentOptions = {}) => {
      const charge = charges.find((c) => c.id === chargeId);
      if (!charge) return;

      const billingType = getBillingType(charge);
      const rate = (charge.loanPercentage || 0) / 100;

      let nextDate = charge.nextInterestDueDate
        ? new Date(charge.nextInterestDueDate)
        : new Date(charge.dueDate);

      if (billingType === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      if (billingType === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      if (billingType === "daily") nextDate.setDate(nextDate.getDate() + 1);

      const interestAmount = charge.amount * rate;

      const updatedCharges = checkOverdue(
        charges.map((c) =>
          c.id === chargeId
            ? {
                ...c,
                accumulatedInterest: 0,
                lastInterestPaymentDate: new Date().toISOString(),
                nextInterestDueDate: nextDate.toISOString().split("T")[0],
                interestInstallmentsPaid:
                  (c.interestInstallmentsPaid || 0) + 1,
              }
            : c
        )
      );

      const payment: Payment = {
        id: generateId(),
        chargeId,
        clientId: charge.clientId,
        amount: interestAmount,
        paidAt: new Date().toISOString(),
        notes: options.notes || `Juros (${billingType})`,
        paymentMethod: options.paymentMethod,
        paymentProof: options.paymentProof,
        type: "interest",
      };

      const updatedPayments = [...payments, payment];

      await saveData({
        clients,
        charges: updatedCharges,
        payments: updatedPayments,
      });

      setCharges(updatedCharges);
      setPayments(updatedPayments);
    },
    [charges, payments, clients, saveData]
  );

  // =======================
  // HOOKS
  // =======================
  const getPaidTotal = useCallback(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const getInterestPaidThisMonth = useCallback(() => {
    const todayCalc = new Date();
    const m = todayCalc.getMonth();
    const y = todayCalc.getFullYear();
    return payments
      .filter((p) => {
        const d = new Date(p.paidAt);
        return d.getMonth() === m && d.getFullYear() === y && (p.type === "interest" || p.notes?.toLowerCase().includes("juros"));
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const getOverdueCharges = useCallback(() => {
    return charges.filter((c) => c.status === "overdue");
  }, [charges]);

  const getUpcomingCharges = useCallback((days: number) => {
    const todayCalc = new Date();
    const future = new Date();
    future.setDate(todayCalc.getDate() + days);
    return charges.filter((c) => {
      const d = new Date(c.dueDate);
      return d > todayCalc && d <= future && c.status !== "paid";
    });
  }, [charges]);

  const getClientById = useCallback((id: string) => {
    return clients.find((c) => c.id === id);
  }, [clients]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    if (!userId) return;
    const local = await AsyncStorage.getItem(getStorageKeyForUser(userId));
    if (local) {
      const data: AppData = JSON.parse(local);
      setClients(data.clients || []);
      setCharges(checkOverdue(data.charges || []));
      setPayments(data.payments || []);
    }
    setIsLoading(false);
  }, [userId, checkOverdue]);

  return (
    <DataContext.Provider
      value={{
        clients,
        charges,
        payments,
        isLoading,
        canUndo,
        getPendingTotal,
        getPaidTotal,
        getInterestPaidThisMonth,
        getOverdueCharges,
        getUpcomingCharges,
        getClientById,
        payMonthlyInterest,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// =======================
// HOOK
// =======================
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
