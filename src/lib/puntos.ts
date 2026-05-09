import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PUNTOS_POR_PESOS } from "@/lib/constants";

/**
 * Acumular puntos tras una cita completada.
 * Se llama después de completar una cita.
 */
export async function acumularPuntos(
  usuarioId: string,
  montoPesos: number
): Promise<number> {
  const puntosGanados = Math.floor(montoPesos / PUNTOS_POR_PESOS);
  const userRef = doc(db, "usuarios", usuarioId);
  await updateDoc(userRef, {
    puntos: increment(puntosGanados),
  });
  return puntosGanados;
}

/**
 * Canjear puntos por una recompensa.
 * Validar que tenga puntos suficientes.
 */
export async function canjearPuntos(
  usuarioId: string,
  puntosRequeridos: number
): Promise<{ success: boolean; error?: string }> {
  const userRef = doc(db, "usuarios", usuarioId);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const puntosActuales = docSnap.data().puntos || 0;

  if (puntosActuales < puntosRequeridos) {
    return { success: false, error: "Puntos insuficientes" };
  }

  await updateDoc(userRef, {
    puntos: increment(-puntosRequeridos),
  });

  return { success: true };
}

/**
 * Obtener puntos actuales de un usuario.
 */
export async function getPuntosUsuario(usuarioId: string): Promise<number> {
  const userRef = doc(db, "usuarios", usuarioId);
  const docSnap = await getDoc(userRef);
  return docSnap.data()?.puntos || 0;
}