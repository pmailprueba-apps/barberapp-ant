import { 
  collection, 
  getDocs, 
  query, 
  where,
  count
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const superAdminService = {
  async getDashboardStats() {
    try {
      const [barberiasSnap, usuariosSnap, transaccionesSnap] = await Promise.all([
        getDocs(collection(db, "barberias")),
        getDocs(collection(db, "usuarios")),
        getDocs(collection(db, "transacciones"))
      ]);

      const barberiasCount = barberiasSnap.size;
      const usuariosCount = usuariosSnap.size;
      
      let ingresosTotales = 0;
      transaccionesSnap.forEach(doc => {
        const data = doc.data();
        if (data.estado === "completado") {
          ingresosTotales += (data.monto || 0);
        }
      });

      const suscripcionesActivas = barberiasSnap.docs.filter(doc => doc.data().estado === "activa").length;

      return {
        barberiasCount,
        usuariosCount,
        ingresosTotales,
        suscripcionesActivas
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        barberiasCount: 0,
        usuariosCount: 0,
        ingresosTotales: 0,
        suscripcionesActivas: 0
      };
    }
  },

  async getRecentActivities(limit = 5) {
    // Esto idealmente vendría de una colección 'logs' o 'actividades'
    // Por ahora devolvemos mock pero estructurado para ser reemplazado
    return [
      {
        id: "1",
        tipo: "barberia",
        mensaje: "Nueva barbería registrada: Barber Style",
        fecha: new Date().toISOString(),
        usuario: "Sistema"
      },
      {
        id: "2",
        tipo: "pago",
        mensaje: "Pago recibido de $29.99 de Luxury Cut",
        fecha: new Date().toISOString(),
        usuario: "Stripe"
      },
      {
        id: "3",
        tipo: "usuario",
        mensaje: "Nuevo usuario registrado: Juan Perez",
        fecha: new Date().toISOString(),
        usuario: "Registro"
      }
    ];
  }
};
