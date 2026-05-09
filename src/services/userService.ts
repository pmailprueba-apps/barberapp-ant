import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Usuario } from "@/types/firebase";

const COLLECTION_NAME = "usuarios";

export const userService = {
  async getAll() {
    const q = query(collection(db, COLLECTION_NAME), orderBy("creado_en", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Usuario));
  },

  async getById(uid: string) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as Usuario;
    }
    return null;
  },

  async getByBarberia(barberiaId: string) {
    const q = query(collection(db, COLLECTION_NAME), where("barberia_id", "==", barberiaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Usuario));
  },

  async getBarberosPendientes(barberiaId: string) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("barberia_id", "==", barberiaId),
      where("role", "==", "barbero"),
      where("activo", "==", false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Usuario));
  },

  async update(uid: string, data: Partial<Usuario>) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, {
      ...data,
      actualizado_en: serverTimestamp()
    }, { merge: true });
  },

  async set(uid: string, data: any) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, {
      ...data,
      actualizado_en: serverTimestamp()
    }, { merge: true });
  },

  async create(uid: string, data: any) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await setDoc(docRef, {
      ...data,
      creado_en: serverTimestamp(),
      actualizado_en: serverTimestamp()
    });
  }
};
