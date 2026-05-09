import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Barberia } from "@/types/firebase";
import { SERVICIOS_CATALOGO } from "@/lib/constants";

export interface ServicioActivo {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_min: number;
  precio: number;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

// Obtener servicios activos de una barbería
export async function getServiciosActivos(barberiaId: string): Promise<ServicioActivo[]> {
  const snapshot = await getDocs(collection(db, "barberias", barberiaId, "servicios_activos"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ServicioActivo));
}

// Agregar servicio a barbería (desde catálogo)
export async function addServicioActivo(
  barberiaId: string,
  servicioId: string
): Promise<string> {
  const catalogo = SERVICIOS_CATALOGO.find((s) => s.id === servicioId);
  if (!catalogo) throw new Error("Servicio no encontrado en catálogo");

  const docRef = await addDoc(collection(db, "barberias", barberiaId, "servicios_activos"), {
    id: servicioId,
    nombre: catalogo.nombre,
    descripcion: `Servicio de ${catalogo.nombre.toLowerCase()}`,
    duracion_min: catalogo.duracion_default,
    precio: catalogo.precio_default,
    activo: true,
    creado_en: serverTimestamp(),
  });
  return docRef.id;
}

// Activar/desactivar servicio
export async function toggleServicioActivo(
  barberiaId: string,
  servicioId: string,
  activo: boolean
): Promise<void> {
  const docRef = doc(db, "barberias", barberiaId, "servicios_activos", servicioId);
  await updateDoc(docRef, { activo, actualizado_en: serverTimestamp() });
}

// Actualizar precio o duración
export async function updateServicioActivo(
  barberiaId: string,
  servicioId: string,
  data: { precio?: number; duracion_min?: number }
): Promise<void> {
  const docRef = doc(db, "barberias", barberiaId, "servicios_activos", servicioId);
  await updateDoc(docRef, { ...data, actualizado_en: serverTimestamp() });
}

// Eliminar servicio (desactivar, no borrar para mantener historial)
export async function removeServicioActivo(
  barberiaId: string,
  servicioId: string
): Promise<void> {
  const docRef = doc(db, "barberias", barberiaId, "servicios_activos", servicioId);
  await updateDoc(docRef, { activo: false, actualizado_en: serverTimestamp() });
}

// Inicializar servicios por defecto al crear barbería
export async function inicializarServiciosDefault(barberiaId: string): Promise<void> {
  for (const servicio of SERVICIOS_CATALOGO) {
    const docRef = await addDoc(
      collection(db, "barberias", barberiaId, "servicios_activos"),
      {
        id: servicio.id,
        nombre: servicio.nombre,
        descripcion: `Servicio de ${servicio.nombre.toLowerCase()}`,
        duracion_min: servicio.duracion_default,
        precio: servicio.precio_default,
        activo: true,
        creado_en: serverTimestamp(),
      }
    );
  }
}
