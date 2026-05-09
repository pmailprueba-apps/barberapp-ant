import { getAdminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { PUNTOS_POR_PESOS } from "./constants";

/**
 * Acumular puntos tras una cita completada (Servidor).
 */
export async function acumularPuntosServer(
  usuarioId: string,
  montoPesos: number
): Promise<number> {
  const puntosGanados = Math.floor(montoPesos / PUNTOS_POR_PESOS);
  const db = getAdminDb();
  const userRef = db.collection("usuarios").doc(usuarioId);
  
  await userRef.update({
    puntos: FieldValue.increment(puntosGanados),
    actualizado_en: FieldValue.serverTimestamp()
  });
  
  return puntosGanados;
}

/**
 * Canjear puntos (Servidor).
 */
export async function canjearPuntosServer(
  usuarioId: string,
  puntosRequeridos: number
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDb();
  const userRef = db.collection("usuarios").doc(usuarioId);
  const doc = await userRef.get();

  if (!doc.exists) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const puntosActuales = doc.data()?.puntos || 0;

  if (puntosActuales < puntosRequeridos) {
    return { success: false, error: "Puntos insuficientes" };
  }

  await userRef.update({
    puntos: FieldValue.increment(-puntosRequeridos),
    actualizado_en: FieldValue.serverTimestamp()
  });

  return { success: true };
}
