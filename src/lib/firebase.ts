import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Conectar a emuladores locales si está configurado
if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
  const host = process.env.NEXT_PUBLIC_EMULATOR_HOST || "127.0.0.1";
  const authPort = process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || "9099";
  const firestorePort = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || "8080";

  connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, parseInt(firestorePort));
  console.log("[Firebase] Conectado a emuladores locales");
}

export { app, auth, db, storage };
