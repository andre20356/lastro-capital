export type ChargeStatus = "pending" | "paid" | "overdue";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentPhoto?: string;
  addressProof?: string;
  requestedAmount?: number;
  loanPercentage?: number;
  dailyDelayRate?: number;
  requestDate?: string;
  notes: string;
  createdAt: string;
  archived?: boolean;
}

export interface Charge {
  id: string;
  clientId: string;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  description: string;
  delayFee?: number;
  loanPercentage?: number;
  dailyDelayRate?: number;
  accumulatedInterest?: number;
  lastInterestPaymentDate?: string;
  nextInterestDueDate?: string;
  paidDate?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  chargeId: string;
  clientId: string;
  amount: number;
  paidAt: string;
  dueDate?: string;
  notes: string;
}

export interface AppData {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
}
