import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase";

export const fcm = typeof window !== "undefined" && "serviceWorker" in navigator ? getMessaging(app) : null;



/**
 * Solicitar permiso de notificaciones y obtener FCM token.
 * Llamar desde el cliente (useEffect) solo una vez.
 */
export async function obtenerFCMToken(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (Notification.permission === "granted") {
    if (!fcm) return null;
    return getToken(fcm, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY }).catch(() => null);
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (!fcm) return null;
      return getToken(fcm, { vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY }).catch(() => null);
    }
  }
  return null;
}

/**
 * Guardar token FCM en Firestore para enviarle notificaciones después.
 */
export async function guardarFCMToken(uid: string, token: string): Promise<void> {
  const { doc, updateDoc, getDoc } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase");
  const userRef = doc(db, "usuarios", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { fcm_token: token, fcm_token_updated: new Date() });
  }
}