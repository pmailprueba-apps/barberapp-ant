import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getBarberia } from "./barberias";
import { getCitasPorFecha } from "./citas";
import type { HorarioDia, Cita } from "@/types/firebase";

const DIAS_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export interface Slot {
  hora: string; // "09:00"
  disponible: boolean;
  barberosOcupados: { id: string; nombre: string }[];
  barberosLibres: { id: string; nombre: string }[];
  razon?: "pasado" | "margen" | "ocupado" | "cerrado";
}

/**
 * Genera la lista de horas base para una fecha y horario específicos.
 */
export function generarSlotsBase(horario: HorarioDia, duracion: number, fechaStr: string, margenMinutos: number = 30): Slot[] {
  try {
    if (!horario || !horario.abre || !horario.cierra || !horario.activo) return [];
    
    const slots: Slot[] = [];
    
    // Validar formato HH:mm
    if (typeof horario.abre !== "string" || !horario.abre.includes(":") || 
        typeof horario.cierra !== "string" || !horario.cierra.includes(":")) {
      return [];
    }

    const [hAbre, mAbre] = horario.abre.split(":").map(Number);
    const [hCierra, mCierra] = horario.cierra.split(":").map(Number);

    if (isNaN(hAbre) || isNaN(mAbre) || isNaN(hCierra) || isNaN(mCierra)) return [];

    const hoy = new Date();
    // Usar fecha local para comparación
    const hoyStr = hoy.getFullYear() + "-" + 
                  String(hoy.getMonth() + 1).padStart(2, '0') + "-" + 
                  String(hoy.getDate()).padStart(2, '0');
    
    const esHoy = fechaStr === hoyStr;

    let actual = new Date(fechaStr + "T00:00:00");
    if (isNaN(actual.getTime())) return [];
    actual.setHours(hAbre, mAbre, 0, 0);

    const fin = new Date(fechaStr + "T00:00:00");
    fin.setHours(hCierra, mCierra, 0, 0);

    const interval = duracion > 0 ? duracion : 30;
    
    // Límite de seguridad para evitar bucles infinitos
    let iterations = 0;
    while (actual < fin && iterations < 500) {
      iterations++;
      
      const hh = String(actual.getHours()).padStart(2, '0');
      const mm = String(actual.getMinutes()).padStart(2, '0');
      const hora = `${hh}:${mm}`;

      let disponible = true;
      let razon: Slot["razon"] = undefined;

      if (esHoy) {
        const tiempoMinimo = new Date(hoy.getTime() + margenMinutos * 60000);
        const yaPaso = actual < hoy;
        const enMargen = actual < tiempoMinimo && !yaPaso;

        if (yaPaso) {
          disponible = false;
          razon = "pasado";
        } else if (enMargen) {
          disponible = false;
          razon = "margen";
        }
      }

      slots.push({ 
        hora, 
        disponible,
        barberosLibres: [],
        barberosOcupados: [],
        razon
      });

      actual.setMinutes(actual.getMinutes() + interval);
    }

    return slots;
  } catch (e) {
    console.error("Error en generarSlotsBase:", e);
    return [];
  }
}

/**
 * Obtiene disponibilidad detallada por fecha.
 */
export async function disponibilidadPorFecha(
  barberiaId: string,
  fecha: string,
  barberoIdReq?: string
): Promise<Slot[]> {
  try {
    if (!barberiaId || !fecha) return [];

    const barberia = await getBarberia(barberiaId);
    if (!barberia || !barberia.horarios) return [];

    // --- NUEVO: Validar días de anticipación ---
    const diasLimite = barberia.dias_anticipacion || 30;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const fechaSolicitada = new Date(fecha + "T00:00:00");
    
    // Calcular diferencia en días
    const diffTime = fechaSolicitada.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > diasLimite) {
      console.log(`Fecha bloqueada por límite (${diasLimite} días): ${fecha}`);
      return []; // No retornar slots si excede el límite
    }
    // ------------------------------------------

    const dateObj = new Date(fecha + "T12:00:00");
    if (isNaN(dateObj.getTime())) return [];
    
    const diaSemana = dateObj.getDay();
    const diaKey = DIAS_KEYS[diaSemana];
    const horario = barberia.horarios[diaKey as keyof typeof barberia.horarios] as HorarioDia;

    if (!horario || !horario.abre || !horario.cierra || !horario.activo) return [];

    // 1. Obtener barberos de forma segura (paralelo)
    const barberosMap = new Map<string, { id: string; nombre: string }>();
    
    const queries = [
      query(collection(db, "usuarios"), where("barberia_id", "==", barberiaId), where("role", "==", "barbero")),
      query(collection(db, "usuarios"), where("barberiaId", "==", barberiaId), where("role", "==", "barbero")),
      query(collection(db, "empleados"), where("barberia_id", "==", barberiaId), where("rol", "==", "barbero")),
      query(collection(db, "empleados"), where("barberiaId", "==", barberiaId), where("rol", "==", "barbero"))
    ];

    const snapshots = await Promise.all(queries.map(q => 
      getDocs(q).catch(err => {
        console.warn("Falla en query de barberos:", err.message);
        return { docs: [] } as any;
      })
    ));
    
    snapshots.forEach((snap, i) => {
      console.log(`[slots] Query ${i} encontró ${snap.docs?.length || 0} barberos`);
      snap.docs?.forEach((d: any) => {
        const data = d.data();
        if (data && !barberosMap.has(d.id)) {
          // Normalizar el nombre para evitar vacíos
          const nombre = data.nombre || data.displayName || data.email?.split("@")[0] || "Barbero";
          barberosMap.set(d.id, { id: d.id, nombre });
        }
      });
    });

    const barberos = Array.from(barberosMap.values());
    if (barberos.length === 0) {
      console.warn(`[slots] No se encontraron barberos para la barbería ${barberiaId} en ninguna colección`);
      return [];
    }
    
    console.log(`[slots] Total barberos únicos encontrados: ${barberos.length}`);

    // 2. Obtener citas
    const citas = await getCitasPorFecha(barberiaId, fecha).catch(() => []);
    
    // 3. Generar slots base con margen de reserva (default 30 min)
    const margen = barberia.margen_reserva_minutos ?? 30;
    let slots = generarSlotsBase(horario, 30, fecha, margen);

    // 4. Calcular ocupación por slot
    slots = slots.map(slot => {
      const [hS, mS] = slot.hora.split(":").map(Number);
      const minS = hS * 60 + mS;
      const durS = 30; // Suponemos 30min por slot para la verificación de disponibilidad

      const barberosOcupadosIds = new Set<string>();

      citas.forEach(c => {
        if (!c || !c.hora) return;
        const estado = c.estado || "pendiente";
        if (estado.includes("cancelada") || estado === "no_show") return;

        const [hC, mC] = c.hora.split(":").map(Number);
        const minC = hC * 60 + mC;
        const durC = c.duracion_min || 30;

        // Si la cita existente se solapa con este slot
        const solapa = (minS >= minC && minS < minC + durC) || (minS + durS > minC && minS < minC);
        
        if (solapa && c.barberoId) {
          barberosOcupadosIds.add(c.barberoId);
        }
      });
      
      const barberosOcupados = barberos.filter(b => barberosOcupadosIds.has(b.id));
      const barberosLibres = barberos.filter(b => !barberosOcupadosIds.has(b.id));

      let disponible = slot.disponible;
      if (barberoIdReq && barberoIdReq !== "" && barberoIdReq !== "cualquiera") {
        const estaLibre = barberosLibres.some(b => b.id === barberoIdReq);
        disponible = disponible && estaLibre;
      } else {
        disponible = disponible && barberosLibres.length > 0;
      }

      return {
        ...slot,
        disponible,
        barberosOcupados,
        barberosLibres
      };
    });

    return slots;
  } catch (e) {
    console.error("Error en disponibilidadPorFecha:", e);
    throw e; 
  }
}
