export type ChargeStatus = "pending" | "paid" | "overdue";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface Charge {
  id: string;
  clientId: string;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  description: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  chargeId: string;
  clientId: string;
  amount: number;
  paidAt: string;
  notes: string;
}

export interface AppData {
  clients: Client[];
  charges: Charge[];
  payments: Payment[];
}
