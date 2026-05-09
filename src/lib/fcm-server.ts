import { getAdminMessaging } from "./firebase-admin-messaging";

/**
 * Enviar push notification a un token específico usando Firebase Admin Messaging.
 */
export async function enviarPushNotification(token: string, title: string, body: string, data?: Record<string, string>): Promise<{ success: boolean; error?: string }> {
  try {
    const messaging = getAdminMessaging();
    await messaging.send({
      token,
      notification: { title, body },
      data: data || {},
      webpush: {
        notification: { icon: "/icons/icon-192x192.svg" },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending push:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Enviar recordatorio de cita via push notification.
 */
export async function enviarRecordatorioPush(params: {
  usuarioFCMToken: string;
  nombreCliente: string;
  nombreBarbero: string;
  servicio: string;
  fecha: string;
  hora: string;
}): Promise<{ success: boolean; error?: string }> {
  return enviarPushNotification(
    params.usuarioFCMToken,
    "⏰ Recordatorio de cita",
    `${params.servicio} con ${params.nombreBarbero} mañana ${params.fecha} a las ${params.hora}`,
    { tipo: "recordatorio", cita_fecha: params.fecha }
  );
}

/**
 * Enviar confirmación de cita via push.
 */
export async function enviarConfirmacionPush(params: {
  usuarioFCMToken: string;
  nombreCliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  barberia: string;
}): Promise<{ success: boolean; error?: string }> {
  return enviarPushNotification(
    params.usuarioFCMToken,
    "✅ Cita confirmada",
    `${params.servicio} en ${params.barberia} el ${params.fecha} a las ${params.hora}`,
    { tipo: "confirmacion", cita_fecha: params.fecha }
  );
}
