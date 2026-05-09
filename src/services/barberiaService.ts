import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Barberia } from "@/types/firebase";

const COLLECTION_NAME = "barberias";

export const barberiaService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("creada_en", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Barberia));
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Barberia;
    }
    return null;
  },

  async getBySlug(slug: string) {
    const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Barberia;
    }
    return null;
  },

  async create(data: Omit<Barberia, "id" | "creada_en" | "proximo_pago">) {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const barberiaData = {
      ...data,
      creada_en: serverTimestamp(),
      proximo_pago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días después
      estado: "activa",
    };
    await setDoc(newDocRef, barberiaData);
    return { id: newDocRef.id, ...barberiaData };
  },

  async update(id: string, data: Partial<Barberia>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      actualizado_en: serverTimestamp(),
    });
  },

  async delete(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { estado: "eliminada", actualizado_en: serverTimestamp() });
    // En un sistema real podrías usar deleteDoc(docRef), pero es mejor soft-delete
  },

  async updateStatus(id: string, nuevoEstado: "activa" | "suspendida" | "pendiente") {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { 
      estado: nuevoEstado,
      actualizado_en: serverTimestamp() 
    });
  }
};
