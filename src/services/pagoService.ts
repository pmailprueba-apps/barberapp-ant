import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "transacciones";

export interface Transaccion {
  id: string;
  barberia_id: string;
  barberia_nombre: string;
  monto: number;
  moneda: string;
  fecha: any; // Firestore Timestamp
  estado: "completado" | "pendiente" | "fallido";
  metodo: string;
  descripcion: string;
}

export const pagoService = {
  async getRecientes(maxResults = 20) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy("fecha", "desc"), 
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaccion));
  },

  async getPorBarberia(barberiaId: string) {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("barberia_id", "==", barberiaId), 
      orderBy("fecha", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaccion));
  },

  async getStats() {
    // En un sistema real, esto se calcularía con agregaciones o una función de cloud
    // Aquí devolvemos un mock estructurado para el dashboard
    return {
      ingresosTotales: 45280,
      suscripcionesActivas: 24,
      pagosPendientes: 1200,
      crecimientoMensual: 12.5
    };
  }
};
