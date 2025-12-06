import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { getDb } from "@/config/firebase";

export interface PaymentProof {
  id?: string;
  clientName: string;
  phone: string;
  cpf?: string;
  proofUrl: string;
  notes?: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: Date;
}

const COLLECTION_NAME = "paymentProofs";

export const paymentProofService = {
  async create(proof: Omit<PaymentProof, "id" | "createdAt" | "status">): Promise<string> {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...proof,
        status: "pending",
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating payment proof:", error);
      throw error;
    }
  },

  async getAll(): Promise<PaymentProof[]> {
    try {
      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PaymentProof[];
    } catch (error) {
      console.error("Error getting payment proofs:", error);
      throw error;
    }
  },

  async getPending(): Promise<PaymentProof[]> {
    try {
      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const proofs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PaymentProof[];
      return proofs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error getting pending proofs:", error);
      throw error;
    }
  },

  async updateStatus(id: string, status: "confirmed" | "rejected"): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error("Error updating payment proof:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting payment proof:", error);
      throw error;
    }
  },
};
