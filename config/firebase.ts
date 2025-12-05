import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDXoVLNhWt3Woz-lK8EIIJ63vr0T6X127A",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "lastrocapital-fb4e8.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "lastrocapital-fb4e8",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "lastrocapital-fb4e8.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "294962452590",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:294962452590:web:61ee302a4e473e97ecee7f",
};

let app: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }
  return app;
}

export function getDb(): Firestore {
  if (!firestoreInstance) {
    const firebaseApp = getFirebaseApp();
    firestoreInstance = getFirestore(firebaseApp);
  }
  return firestoreInstance;
}
