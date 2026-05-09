import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp } from "./firebase-admin";

let _messaging: ReturnType<typeof getMessaging> | null = null;

export function getAdminMessaging() {
  if (!_messaging) {
    const app = getAdminApp();
    if (!app) {
      throw new Error("No se pudo inicializar Firebase Admin para mensajería");
    }
    _messaging = getMessaging(app);
  }
  return _messaging;
}