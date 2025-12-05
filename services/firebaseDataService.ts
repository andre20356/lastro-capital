import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import { getDb } from "@/config/firebase";
import { Client, Charge, Payment, AppData } from "@/types";

const CLIENTS_COLLECTION = "clients";
const CHARGES_COLLECTION = "charges";
const PAYMENTS_COLLECTION = "payments";

function normalizeUserId(userId: string): string {
  return userId || "anonymous";
}

export const firebaseDataService = {
  async getClients(userId: string): Promise<Client[]> {
    try {
      const db = getDb();
      const clientsRef = collection(db, CLIENTS_COLLECTION);
      const q = query(clientsRef, where("userId", "==", normalizeUserId(userId)));
      console.log("Firebase: Getting clients for userId:", normalizeUserId(userId));
      const snapshot = await getDocs(q);
      console.log("Firebase: Got", snapshot.docs.length, "clients");
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          documentPhoto: data.documentPhoto,
          addressProof: data.addressProof,
          requestedAmount: data.requestedAmount,
          loanPercentage: data.loanPercentage,
          dailyDelayRate: data.dailyDelayRate,
          requestDate: data.requestDate,
          notes: data.notes || "",
          createdAt: data.createdAt || new Date().toISOString(),
          archived: data.archived || false,
        } as Client;
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error getting clients:", errorMessage, error);
      return [];
    }
  },

  async addClient(userId: string, client: Omit<Client, "id" | "createdAt">): Promise<Client> {
    try {
      const db = getDb();
      const newClient = {
        ...client,
        userId: normalizeUserId(userId),
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), newClient);
      return { ...newClient, id: docRef.id } as Client;
    } catch (error) {
      console.error("Error adding client:", error);
      throw error;
    }
  },

  async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      const cleanUpdates: Record<string, unknown> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  },

  async deleteClient(clientId: string): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  },

  async getCharges(userId: string): Promise<Charge[]> {
    try {
      const db = getDb();
      const chargesRef = collection(db, CHARGES_COLLECTION);
      const q = query(chargesRef, where("userId", "==", normalizeUserId(userId)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          clientId: data.clientId || "",
          amount: data.amount || 0,
          dueDate: data.dueDate || "",
          status: data.status || "pending",
          description: data.description || "",
          delayFee: data.delayFee,
          loanPercentage: data.loanPercentage,
          dailyDelayRate: data.dailyDelayRate,
          accumulatedInterest: data.accumulatedInterest,
          lastInterestPaymentDate: data.lastInterestPaymentDate,
          nextInterestDueDate: data.nextInterestDueDate,
          paidDate: data.paidDate,
          createdAt: data.createdAt || new Date().toISOString(),
        } as Charge;
      });
    } catch (error) {
      console.error("Error getting charges:", error);
      return [];
    }
  },

  async addCharge(userId: string, charge: Omit<Charge, "id" | "createdAt">): Promise<Charge> {
    try {
      const db = getDb();
      const newCharge = {
        ...charge,
        userId: normalizeUserId(userId),
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, CHARGES_COLLECTION), newCharge);
      return { ...newCharge, id: docRef.id } as Charge;
    } catch (error) {
      console.error("Error adding charge:", error);
      throw error;
    }
  },

  async updateCharge(chargeId: string, updates: Partial<Charge>): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, CHARGES_COLLECTION, chargeId);
      const cleanUpdates: Record<string, unknown> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanUpdates[key] = value;
        }
      });
      await updateDoc(docRef, cleanUpdates);
    } catch (error) {
      console.error("Error updating charge:", error);
      throw error;
    }
  },

  async deleteCharge(chargeId: string): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, CHARGES_COLLECTION, chargeId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting charge:", error);
      throw error;
    }
  },

  async getPayments(userId: string): Promise<Payment[]> {
    try {
      const db = getDb();
      const paymentsRef = collection(db, PAYMENTS_COLLECTION);
      const q = query(paymentsRef, where("userId", "==", normalizeUserId(userId)));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          chargeId: data.chargeId || "",
          clientId: data.clientId || "",
          amount: data.amount || 0,
          paidAt: data.paidAt || new Date().toISOString(),
          dueDate: data.dueDate,
          notes: data.notes || "",
          paymentMethod: data.paymentMethod,
          paymentProof: data.paymentProof,
        } as Payment;
      });
    } catch (error) {
      console.error("Error getting payments:", error);
      return [];
    }
  },

  async addPayment(userId: string, payment: Omit<Payment, "id">): Promise<Payment> {
    try {
      const db = getDb();
      const newPayment = {
        ...payment,
        userId: normalizeUserId(userId),
      };
      const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), newPayment);
      return { ...newPayment, id: docRef.id } as Payment;
    } catch (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
  },

  async deletePayment(paymentId: string): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  },

  async deleteClientCascade(clientId: string, userId: string): Promise<void> {
    try {
      const db = getDb();
      const batch = writeBatch(db);
      
      const chargesRef = collection(db, CHARGES_COLLECTION);
      const chargesQuery = query(chargesRef, where("clientId", "==", clientId));
      const chargesSnapshot = await getDocs(chargesQuery);
      
      const chargeIds = chargesSnapshot.docs.map(d => d.id);
      
      const paymentsRef = collection(db, PAYMENTS_COLLECTION);
      for (const chargeId of chargeIds) {
        const paymentsQuery = query(paymentsRef, where("chargeId", "==", chargeId));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        paymentsSnapshot.docs.forEach(paymentDoc => {
          batch.delete(paymentDoc.ref);
        });
      }
      
      chargesSnapshot.docs.forEach(chargeDoc => {
        batch.delete(chargeDoc.ref);
      });
      
      const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
      batch.delete(clientRef);
      
      await batch.commit();
    } catch (error) {
      console.error("Error deleting client cascade:", error);
      throw error;
    }
  },

  async deleteChargeCascade(chargeId: string): Promise<void> {
    try {
      const db = getDb();
      const batch = writeBatch(db);
      
      const paymentsRef = collection(db, PAYMENTS_COLLECTION);
      const paymentsQuery = query(paymentsRef, where("chargeId", "==", chargeId));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      paymentsSnapshot.docs.forEach(paymentDoc => {
        batch.delete(paymentDoc.ref);
      });
      
      const chargeRef = doc(db, CHARGES_COLLECTION, chargeId);
      batch.delete(chargeRef);
      
      await batch.commit();
    } catch (error) {
      console.error("Error deleting charge cascade:", error);
      throw error;
    }
  },

  async migrateFromLocal(userId: string, data: AppData): Promise<void> {
    try {
      const db = getDb();
      const batch = writeBatch(db);
      const normalizedUserId = normalizeUserId(userId);
      
      for (const client of data.clients) {
        const clientRef = doc(collection(db, CLIENTS_COLLECTION));
        batch.set(clientRef, {
          ...client,
          id: undefined,
          firestoreId: clientRef.id,
          originalId: client.id,
          userId: normalizedUserId,
        });
      }
      
      for (const charge of data.charges) {
        const chargeRef = doc(collection(db, CHARGES_COLLECTION));
        batch.set(chargeRef, {
          ...charge,
          id: undefined,
          firestoreId: chargeRef.id,
          originalId: charge.id,
          userId: normalizedUserId,
        });
      }
      
      for (const payment of data.payments) {
        const paymentRef = doc(collection(db, PAYMENTS_COLLECTION));
        batch.set(paymentRef, {
          ...payment,
          id: undefined,
          firestoreId: paymentRef.id,
          originalId: payment.id,
          userId: normalizedUserId,
        });
      }
      
      await batch.commit();
      console.log("Migration completed successfully");
    } catch (error) {
      console.error("Error migrating data:", error);
      throw error;
    }
  },

  async getAllData(userId: string): Promise<AppData> {
    const [clients, charges, payments] = await Promise.all([
      this.getClients(userId),
      this.getCharges(userId),
      this.getPayments(userId),
    ]);
    return { clients, charges, payments };
  },
};
