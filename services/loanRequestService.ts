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
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { getDb } from "@/config/firebase";

export interface LoanRequest {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  requestedAmount: number;
  purpose?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  notes?: string;
}

const COLLECTION_NAME = "loanRequests";

export const loanRequestService = {
  async create(request: Omit<LoanRequest, "id" | "createdAt" | "status">): Promise<string> {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...request,
        status: "pending",
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating loan request:", error);
      throw error;
    }
  },

  async getAll(): Promise<LoanRequest[]> {
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
      })) as LoanRequest[];
    } catch (error) {
      console.error("Error getting loan requests:", error);
      throw error;
    }
  },

  async getPending(): Promise<LoanRequest[]> {
    try {
      const db = getDb();
      const q = query(
        collection(db, COLLECTION_NAME),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as LoanRequest[];
      return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  },

  async updateStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error("Error updating loan request:", error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting loan request:", error);
      throw error;
    }
  },

  subscribeToRequests(callback: (requests: LoanRequest[]) => void): () => void {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as LoanRequest[];
      const sortedRequests = requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      callback(sortedRequests);
    }, (error) => {
      console.error("Error in subscription:", error);
    });

    return unsubscribe;
  },
};

export async function getPendingLoanRequests(): Promise<LoanRequest[]> {
  return loanRequestService.getPending();
}
