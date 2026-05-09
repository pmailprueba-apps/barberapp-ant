import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Barberia } from "@/types/firebase";

// Obtener todas las barberías (superadmin)
export async function getBarberias(): Promise<Barberia[]> {
  const q = query(collection(db, "barberias"), orderBy("creada_en", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Barberia));
}

// Obtener barbería por ID
export async function getBarberia(id: string): Promise<Barberia | null> {
  const docRef = doc(db, "barberias", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Barberia;
}

// Obtener barbería por slug (para landing QR)
export async function getBarberiaPorSlug(slug: string): Promise<Barberia | null> {
  const q = query(collection(db, "barberias"), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Barberia;
}

// Crear barbería
export async function createBarberia(data: Omit<Barberia, "id" | "creada_en">): Promise<string> {
  const docRef = await addDoc(collection(db, "barberias"), {
    ...data,
    creada_en: serverTimestamp(),
  });
  return docRef.id;
}

// Actualizar barbería
export async function updateBarberia(id: string, data: Partial<Barberia>): Promise<void> {
  const docRef = doc(db, "barberias", id);
  await updateDoc(docRef, {
    ...data,
    actualizado_en: serverTimestamp(),
  });
}

export async function deleteBarberia(id: string): Promise<void> {
  const docRef = doc(db, "barberias", id);
  await deleteDoc(docRef);
}

// Actualizar estado (superadmin only)
export async function cambiarEstadoBarberia(
  id: string,
  estado: Barberia["estado"]
): Promise<void> {
  const docRef = doc(db, "barberias", id);
  const updates: Record<string, unknown> = { estado };
  if (estado === "suspendida") updates.suspendida_en = serverTimestamp();
  if (estado === "bloqueada") updates.bloqueada_en = serverTimestamp();
  if (estado === "activa") {
    updates.suspendida_en = null;
    updates.bloqueada_en = null;
  }
  await updateDoc(docRef, updates);
}
