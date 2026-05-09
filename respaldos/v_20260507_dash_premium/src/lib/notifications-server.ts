import { getAdminDb, getAdminMessaging } from "./firebase-admin";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Envía una notificación a un usuario específico.
 * Intenta enviar vía Push (FCM) y también guarda en la colección 'notificaciones' para el historial in-app.
 */
export async function enviarNotificacionUsuario(uid: string, payload: NotificationPayload) {
  const db = getAdminDb();
  
  try {
    // 1. Guardar en Firestore (Notificación In-App)
    await db.collection("usuarios").doc(uid).collection("notificaciones").add({
      ...payload,
      leida: false,
      fecha: new Date(),
    });

    // 2. Intentar enviar Push Notification si tiene token
    const userDoc = await db.collection("usuarios").doc(uid).get();
    const fcmToken = userDoc.data()?.fcm_token;

    if (fcmToken) {
      const messaging = getAdminMessaging();
      await messaging.send({
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
      });
      console.log(`Notificación Push enviada a ${uid}`);
    }
  } catch (error) {
    console.error(`Error enviando notificación a ${uid}:`, error);
  }
}

/**
 * Notifica a los administradores de una barbería.
 */
export async function notificarAdminsBarberia(barberiaId: string, payload: NotificationPayload) {
  const db = getAdminDb();
  try {
    const adminsSnap = await db.collection("usuarios")
      .where("barberia_id", "==", barberiaId)
      .where("role", "==", "admin")
      .get();

    const promesas = adminsSnap.docs.map(doc => enviarNotificacionUsuario(doc.id, payload));
    await Promise.all(promesas);
  } catch (error) {
    console.error(`Error notificando admins de barberia ${barberiaId}:`, error);
  }
}
