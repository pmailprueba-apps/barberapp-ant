import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";

// Soporte emuladores locales (desarrollo local sin tocar producción)
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true" || process.env.FIREBASE_USE_EMULATOR === "true";

let _app: ReturnType<typeof initializeApp> | null = null;

export function getAdminApp() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  if (!_app) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    if (USE_EMULATOR) {
      // Emulador local: proyecto fake, no necesita credenciales reales
      _app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-local",
      });
      console.log("[Firebase Admin] Modo emulador activo");
      return _app;
    }

    if (!projectId || !clientEmail || !rawKey) {
      const missing = [];
      if (!projectId) missing.push("PROJECT_ID");
      if (!clientEmail) missing.push("CLIENT_EMAIL");
      if (!rawKey) missing.push("PRIVATE_KEY");
      const errorMsg = `Auth: Missing Firebase Admin variables: ${missing.join(", ")}`;
      console.error(errorMsg);
      return null;
    }

    // RECONSTRUCCIÓN SÚPER-FLEXIBLE
    // 1. Extraer solo el contenido entre los guiones o limpiar todo lo que no sea base64
    let content = rawKey
      .replace(/-----BEGIN [^-]+-----/g, "")
      .replace(/-----END [^-]+-----/g, "")
      .replace(/\\n/g, "")
      .replace(/\n/g, "")
      .replace(/\s+/g, "")
      .replace(/['"]/g, "")
      .trim();

    // 2. Re-envolver en el formato estándar que Firebase AMA
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";
    
    if (content.length < 500) {
      throw new Error(`La llave privada es demasiado corta (${content.length} caracteres). Está incompleta en Vercel.`);
    }

    const matches = content.match(/.{1,64}/g);
    const privateKey = matches 
      ? `${header}\n${matches.join("\n")}\n${footer}`
      : `${header}\n${content}\n${footer}`;

    try {
      _app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
      });
      console.log("Auth: Firebase Admin initialized successfully");
    } catch (error: any) {
      console.error("Auth: Error initializing Firebase Admin SDK:", error);
      throw new Error(`Firebase Admin Init Error: ${error.message}`);
    }
  }
  return _app;
}

export function getAdminAuth() {
  if (USE_EMULATOR) {
    const app = getAdminApp();
    if (!app) throw new Error("Firebase Admin not configured");
    return getAuth(app);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) throw new Error("Falta FIREBASE_PROJECT_ID");
  if (!clientEmail) throw new Error("Falta FIREBASE_CLIENT_EMAIL");
  if (!rawKey) throw new Error("Falta FIREBASE_PRIVATE_KEY");

  const app = getAdminApp();
  if (!app) throw new Error("Error al inicializar Firebase Admin App");
  return getAuth(app);
}

export function getAdminDb() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getFirestore(app);
}

export function getAdminStorage() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getStorage(app);
}

export function getAdminMessaging() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getMessaging(app);
}