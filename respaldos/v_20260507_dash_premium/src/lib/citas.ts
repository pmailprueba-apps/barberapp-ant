import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Cita, Barberia } from "@/types/firebase";

// Obtener citas por barbería y fecha
export async function getCitasPorFecha(
  barberiaId: string,
  fecha: string,
  barberoId?: string
): Promise<Array<{ id: string; hora: string; duracion_min: number; estado: string; barberoId?: string }>> {
  try {
    if (!barberiaId || !fecha) return [];
    
    // Obtenemos todas las citas del día para filtrar en memoria de forma robusta
    let q = query(
      collection(db, "barberias", barberiaId, "citas"),
      where("fecha", "==", fecha)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => {
        const data = d.data();
        if (!data.hora) return null;
        
        // Normalizar ID de barbero para compatibilidad
        const bId = data.barbero_id || data.barberoId;

        // Si se pidió un barbero específico, filtrar en memoria
        if (barberoId && barberoId !== "cualquiera" && bId !== barberoId) {
          return null;
        }

        return {
          id: d.id,
          hora: data.hora,
          duracion_min: data.servicio?.duracion_min || data.duracion_min || 30,
          estado: data.estado || "pendiente",
          barberoId: bId,
          clienteId: data.cliente_id || data.clienteId,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  } catch (e) {
    console.error("Error en getCitasPorFecha:", e);
    return [];
  }
}

// Obtener una cita por ID
export async function getCita(citaId: string, barberiaId: string): Promise<Cita | null> {
  try {
    const docRef = doc(db, "barberias", barberiaId, "citas", citaId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Cita;
  } catch (e) {
    console.error("Error en getCita:", e);
    return null;
  }
}

// Crear una cita (con verificación anti-doble-booking)
export async function crearCita(
  barberiaId: string,
  data: {
    clienteId: string;
    barberoId: string;
    servicioId: string;
    fecha: string;
    hora: string;
    precio?: number;
    servicioNombre?: string;
    duracion_min?: number;
  }
): Promise<{ success: boolean; citaId?: string; error?: string }> {
  try {
    const { clienteId, barberoId, servicioId, fecha, hora, precio, servicioNombre, duracion_min } = data;

    console.log(`Intentando crear cita: ${barberiaId} | ${barberoId} | ${fecha} ${hora}`);

    const durN = duracion_min || 30;
    const [hN, mN] = hora.split(":").map(Number);
    const minN = hN * 60 + mN;

    console.log(`[SERVER] Iniciando crearCita para ${fecha} ${hora}`);
    const startTotal = Date.now();

    const citasRef = collection(db, "barberias", barberiaId, "citas");
    
    console.log(`[SERVER] Consultando todas las citas del día ${fecha}...`);
    const q = query(citasRef, where("fecha", "==", fecha));
    const snap = await getDocs(q);
    
    // Filtrar en memoria para ser robustos ante falta de índices
    const citasExistentes = snap.docs
      .map(d => ({ ...d.data(), id: d.id }) as any)
      .filter(cita => cita.barbero_id === barberoId || cita.barberoId === barberoId);

    console.log(`[SERVER] ${citasExistentes.length} citas encontradas para el barbero.`);

    // --- INICIO DE TRANSACCIÓN ---
    const result = await runTransaction(db, async (transaction) => {
      // 2. Obtener configuración de la barbería para verificar margen
      const barberiaRef = doc(db, "barberias", barberiaId);
      const barberiaSnap = await transaction.get(barberiaRef);
      if (barberiaSnap.exists()) {
        const bData = barberiaSnap.data();
        const margen = bData.margen_reserva_minutos ?? 30;
        const diasAnticipacion = bData.dias_anticipacion ?? 5;

        // Validar anticipación máxima
        const hoy = new Date();
        const fechaCita = new Date(fecha + "T00:00:00");
        const diffDias = Math.ceil((fechaCita.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDias > diasAnticipacion) {
          throw new Error(`Solo puedes agendar hasta con ${diasAnticipacion} días de anticipación`);
        }

        // Validar margen para hoy
        const hoyStr = hoy.toISOString().split("T")[0];
        if (fecha === hoyStr) {
          const [hS, mS] = hora.split(":").map(Number);
          const fechaHoraCita = new Date(hoy);
          fechaHoraCita.setHours(hS, mS, 0, 0);
          
          const tiempoMinimo = new Date(hoy.getTime() + margen * 60000);
          if (fechaHoraCita < tiempoMinimo) {
            throw new Error(`Para hoy, debes agendar con al menos ${margen} min de anticipación`);
          }
        }
      }

      // 3. Verificar conflicto e Idempotencia
      const citaExistenteMismoCliente = citasExistentes.find((c: any) => 
        c.cliente_id === clienteId && c.hora === hora && !c.estado.includes("cancelada")
      );

      if (citaExistenteMismoCliente) {
        console.log(`[SERVER-TX] Idempotencia: El cliente ya tiene esta cita. Retornando ID existente.`);
        return { success: true, id: citaExistenteMismoCliente.id };
      }

      const conflicto = citasExistentes.find((c: any) => {
        const [hC, mC] = c.hora.split(":").map(Number);
        const minC = hC * 60 + mC;
        const durC = c.duracion_min || 30;
        const estado = c.estado || "pendiente";
        
        if (estado.includes("cancelada") || estado === "no_show") return false;

        const solapa = (minN >= minC && minN < minC + durC) || (minN + durN > minC && minN < minC);
        if (solapa) {
          console.log(`[SERVER-TX] Conflicto real: Nueva(${hora}) vs Existente(${c.hora || '?'}) por cliente ${c.cliente_id || c.clienteId || 'desconocido'}`);
        }
        return solapa;
      });

      if (conflicto) {
        throw new Error("Este barbero ya tiene una cita en ese horario");
      }

      // 4. Si no hay conflicto, crear la cita
      const newDocRef = doc(collection(db, "barberias", barberiaId, "citas"));
      const nuevaCita = {
        cliente_id: clienteId,
        barbero_id: barberoId,
        servicio_id: servicioId,
        fecha,
        hora,
        precio,
        servicio_nombre: servicioNombre,
        duracion_min: durN,
        estado: "confirmada",
        creado_en: serverTimestamp(),
        actualizado_en: serverTimestamp(),
        barberia_id: barberiaId // Denormalización
      };

      transaction.set(newDocRef, nuevaCita);
      console.log(`[SERVER-TX] Éxito. Cita creada en ${Date.now() - startTotal}ms`);

      return { success: true, id: newDocRef.id };
    });
    // --- FIN DE TRANSACCIÓN ---

    return { success: true, citaId: result.id };
  } catch (e: any) {
    console.error("Error crítico en crearCita:", e);
    return { success: false, error: e.message || "Error interno al crear la cita" };
  }
}

// Actualizar estado de una cita
export async function actualizarEstadoCita(
  barberiaId: string,
  citaId: string,
  estado: Cita["estado"],
  additionalData?: Partial<Cita>
): Promise<void> {
  const docRef = doc(db, "barberias", barberiaId, "citas", citaId);
  
  if (estado === "completada") {
    const citaSnap = await getDoc(docRef);
    if (citaSnap.exists()) {
      const data = citaSnap.data();
      const { clienteId, precio } = data;
      if (clienteId) {
        const { acumularPuntos } = await import("@/lib/puntos");
        await acumularPuntos(clienteId, precio || 100); 
      }
    }
  }

  await updateDoc(docRef, {
    estado,
    ...additionalData,
    actualizado_en: serverTimestamp(),
  });
}

// Cancelar cita
export async function cancelarCita(
  barberiaId: string,
  citaId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cita = await getCita(citaId, barberiaId);
    if (!cita) return { success: false, error: "Cita no encontrada" };

    const [h, m] = cita.hora.split(":").map(Number);
    const fechaHora = new Date(cita.fecha + "T00:00:00");
    fechaHora.setHours(h, m, 0, 0);

    const ahora = new Date();
    const diffMin = (fechaHora.getTime() - ahora.getTime()) / 60000;

    if (diffMin < 60) {
      return { success: false, error: "No se puede cancelar dentro de la hora previa" };
    }

    await actualizarEstadoCita(barberiaId, citaId, "cancelada_cliente", { motivo_cancelacion: reason || null });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function completarCita(
  barberiaId: string,
  citaId: string
): Promise<void> {
  await actualizarEstadoCita(barberiaId, citaId, "completada");
}

export async function calificarCita(
  barberiaId: string,
  citaId: string,
  calificacion: number,
  comentario?: string
): Promise<void> {
  if (calificacion < 1 || calificacion > 5) {
    throw new Error("La calificación debe estar entre 1 y 5");
  }
  const docRef = doc(db, "barberias", barberiaId, "citas", citaId);
  await updateDoc(docRef, {
    calificacion,
    comentario: comentario || null,
    actualizado_en: serverTimestamp(),
  });
}

export async function getMetricasNegocio(barberiaId: string, barberoId?: string) {
  let q = query(
    collection(db, "barberias", barberiaId, "citas"),
    where("estado", "==", "completada")
  );

  if (barberoId) {
    q = query(q, where("barbero_id", "==", barberoId));
  }
  
  const snapshot = await getDocs(q);
  const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Cita));

  const ventasPorDia: Record<string, number> = {};
  const ventasPorMes: Record<string, number> = {};
  const ventasPorHora: Record<string, number> = {};

  citas.forEach(cita => {
    const precio = cita.precio || 0;
    ventasPorDia[cita.fecha] = (ventasPorDia[cita.fecha] || 0) + precio;
    const mes = cita.fecha.substring(0, 7);
    ventasPorMes[mes] = (ventasPorMes[mes] || 0) + precio;
    const hora = cita.hora.split(":")[0];
    ventasPorHora[hora] = (ventasPorHora[hora] || 0) + precio;
  });

  return {
    ventasPorDia,
    ventasPorMes,
    ventasPorHora,
    totalVentas: citas.reduce((acc, c) => acc + (c.precio || 0), 0),
    totalCitas: citas.length
  };
}
