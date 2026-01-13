// =====================
// TIPOS GLOBAIS
// =====================

export type ChargeStatus = "pending" | "paid" | "overdue";

export type BillingType = "monthly" | "weekly" | "daily";

export type PaymentMethod = "pix" | "dinheiro" | "outro";

export type PaymentType = "principal" | "interest" | "delay_fee";

// =====================
// USUÁRIO
// =====================

export interface User {
  id: string;
  email: string;
  password: string;
}

// =====================
// CLIENTE
// =====================

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;

  documentPhoto?: string;
  addressProof?: string;

  requestedAmount?: number;

  loanPercentage?: number;      // % de juros
  dailyDelayRate?: number;      // multa diária

  billingType?: BillingType;    // ✅ MODALIDADE DO EMPRÉSTIMO

  requestDate?: string;
  notes: string;
  createdAt: string;
  archived?: boolean;
}

// =====================
// COBRANÇA
// =====================

export interface Charge {
  id: string;
  clientId: string;

  amount: number;
  dueDate: string;

  status: ChargeStatus;
  description: string;

  loanPercentage?: number;
  dailyDelayRate?: number;

  delayFee?: number;
  accumulatedInterest?: number;

  lastInterestPaymentDate?: string;
  nextInterestDueDate?: string;
  interestInstallmentsPaid?: number;

  paidDate?: string;
  createdAt: string;

  billingType?: BillingType; // ✅ mensal | semanal | diário
}

// =====================
// PAGAMENTO
// =====================

export interface Payment {
  id: string;
  chargeId: string;
  clientId: string;

  amount: number;
  paidAt: string;
  dueDate?: string;

  notes: string;

  paymentMethod?: PaymentMethod;
  paymentProof?: string;
  type?: PaymentType;
}

// =====================
// ESTADO GLOBAL DO APP
// =====================

export interface AppData {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
}
