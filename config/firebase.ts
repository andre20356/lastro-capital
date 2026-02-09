import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

if (typeof navigator !== 'undefined' && !navigator.userAgent) {
  (navigator as Navigator & { userAgent: string }).userAgent = 'ReactNative';
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let firestoreError: Error | null = null;

function getInitializedApp(): FirebaseApp {
  if (!app) {
    try {
      if (getApps().length === 0) {
        console.log("Firebase: Initializing app...");
        app = initializeApp(firebaseConfig);
      } else {
        console.log("Firebase: App already initialized");
        app = getApp();
      }
    } catch (error) {
      console.error("Firebase: Error initializing app:", error);
      throw error;
    }
  }
  return app;
}

function initFirestore(): Firestore | null {
  if (firestoreError) {
    return null;
  }
  
  if (db) {
    return db;
  }

  try {
    const firebaseApp = getInitializedApp();
    
    if (Platform.OS === 'web') {
      db = initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true,
      });
    } else {
      // Para nativo, garantimos que o Firestore seja inicializado corretamente
      db = getFirestore(firebaseApp);
    }
    
    console.log("Firebase: Firestore initialized successfully");
    return db;
  } catch (error) {
    console.error("Firebase: Error initializing Firestore:", error);
    firestoreError = error as Error;
    return null;
  }
}

export function getFirebaseApp(): FirebaseApp {
  return getInitializedApp();
}

export function getDb(): Firestore | null {
  return initFirestore();
}

export function isFirestoreAvailable(): boolean {
  if (firestoreError) return false;
  const firestore = initFirestore();
  return firestore !== null;
}

export function getFirestoreError(): Error | null {
  return firestoreError;
}
