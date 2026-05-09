import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue, DocumentData } from "firebase-admin/firestore";
import { enviarNotificacionUsuario, notificarAdminsBarberia } from "./notifications-server";

/**
 * Versión de servidor para crear citas usando Firebase Admin SDK.
 * Más robusta, rápida y segura para transacciones.
 */
export async function crearCitaServer(
  barberiaId: string,
  data: {
    clienteId: string;
    barberoId: string;
    servicioId: string;
    fecha: string;
    hora: string;
    precio?: number;
    servicioNombre?: string;
    duracionMin?: number;
  }
) {
  const db = getAdminDb();
  const { clienteId, barberoId, servicioId, fecha, hora, precio, servicioNombre, duracionMin } = data;

  console.log(`[SERVER-ADMIN] Intentando crear cita: ${barberiaId} | ${barberoId} | ${fecha} ${hora}`);
  const startTotal = Date.now();

  try {
    const citasRef = db.collection("barberias").doc(barberiaId).collection("citas");
    
    // 1. Consultar citas del día (para verificar conflictos)
    const snap = await citasRef.where("fecha", "==", fecha).get();
    const citasExistentes = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter(c => c.barbero_id === barberoId || c.barberoId === barberoId);

    const [hN, mN] = hora.split(":").map(Number);
    const minN = hN * 60 + mN;
    const durN = duracionMin || 30;

    // 2. Transacción
    const result = await db.runTransaction(async (transaction) => {
      // Verificar idempotencia
      const yaExiste = citasExistentes.find(c => 
        c.cliente_id === clienteId && c.hora === hora && !c.estado?.includes("cancelada")
      );

      if (yaExiste) {
        return { success: true, id: yaExiste.id, message: "Cita ya existente (idempotencia)" };
      }

      // Verificar conflicto de horario
      const conflicto = citasExistentes.find(c => {
        const [hC, mC] = c.hora.split(":").map(Number);
        const minC = hC * 60 + mC;
        const durC = c.duracion_min || 30;
        const estado = c.estado || "pendiente";
        
        if (estado.includes("cancelada") || estado === "no_show") return false;

        return (minN >= minC && minN < minC + durC) || (minN + durN > minC && minN < minC);
      });

      if (conflicto) {
        throw new Error("El barbero ya tiene una cita en este horario");
      }

      // Crear nueva cita
      const newDocRef = citasRef.doc();
      const nuevaCita = {
        cliente_id: clienteId,
        barbero_id: barberoId,
        servicio_id: servicioId,
        fecha,
        hora,
        precio: precio || 0,
        servicio_nombre: servicioNombre || "Servicio",
        duracion_min: durN,
        estado: "pendiente",
        creado_en: FieldValue.serverTimestamp(),
        actualizado_en: FieldValue.serverTimestamp(),
        barberia_id: barberiaId
      };

      transaction.set(newDocRef, nuevaCita);

      // Notificaciones asíncronas (después de la transacción)
      setTimeout(async () => {
        try {
          // Obtener datos del cliente y barbero para un mensaje más completo
          const [clienteDoc, barberoDoc] = await Promise.all([
            db.collection("usuarios").doc(clienteId).get(),
            db.collection("usuarios").doc(barberoId).get()
          ]);
          
          const clienteData = clienteDoc.data();
          const barberoData = barberoDoc.data();
          const clienteNombre = clienteData?.nombre || "Un cliente";
          const barberoNombre = barberoData?.nombre || "el barbero";

          const payload = {
            title: "Nueva Reserva",
            body: `${clienteNombre} ha reservado con ${barberoNombre} para el ${fecha} a las ${hora}.`,
            data: { citaId: newDocRef.id, type: "nueva_reserva" }
          };
          
          // 1. Notificar al barbero y admins vía Push/App
          await enviarNotificacionUsuario(barberoId, payload);
          await notificarAdminsBarberia(barberiaId, payload);
          
          // 2. Notificar al cliente que recibimos su reserva
          await enviarNotificacionUsuario(clienteId, {
            title: "Reserva recibida",
            body: `Hola ${clienteNombre}, hemos recibido tu solicitud para el ${fecha} a las ${hora}. Pendiente de confirmación.`,
            data: { citaId: newDocRef.id, type: "reserva_pendiente" }
          });

          // 3. ENVIAR MENSAJE AUTOMÁTICO AL CHAT
          // Esto crea una entrada en la mensajería interna
          const chatId = [clienteId, barberoId].sort().join("_");
          const chatRef = db.collection("chats").doc(chatId);
          const autoMsg = {
            text: `📅 NUEVA RESERVA: He reservado un turno de "${servicioNombre}" para el día ${fecha} a las ${hora}. Quedo atento a la confirmación.`,
            senderId: clienteId,
            senderName: clienteNombre,
            createdAt: FieldValue.serverTimestamp(),
          };

          // Crear el mensaje en la subcolección
          await chatRef.collection("messages").add(autoMsg);
          
          // Actualizar el documento del chat (metadatos)
          await chatRef.set({
            lastMessage: autoMsg.text,
            lastSenderId: clienteId,
            lastSenderName: clienteNombre,
            updatedAt: FieldValue.serverTimestamp(),
            participants: [clienteId, barberoId]
          }, { merge: true });

        } catch (e) {
          console.error("Error en notificaciones de nueva cita:", e);
        }
      }, 0);

      return { success: true, id: newDocRef.id };
    });

    console.log(`[SERVER-ADMIN] Éxito en ${Date.now() - startTotal}ms`);
    return result;

  } catch (error: any) {
    console.error("[SERVER-ADMIN] Error fatal:", error.message);
    return { success: false, error: error.message || "Error interno del servidor" };
  }
}

/**
 * Obtiene métricas de negocio usando el Admin SDK.
 */
export async function getMetricasNegocioServer(barberiaId: string, barberoId?: string) {
  const db = getAdminDb();
  
  let query = db.collection("barberias").doc(barberiaId).collection("citas")
    .where("estado", "in", ["completada", "confirmada"]);

  if (barberoId) {
    query = query.where("barbero_id", "==", barberoId);
  }

  try {
    const snapshot = await query.get();
    const citas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    const ventasPorDia: Record<string, number> = {};
    const ventasPorMes: Record<string, number> = {};
    const ventasPorHora: Record<string, number> = {};

    citas.forEach(cita => {
      const precio = Number(cita.precio || 0);
      const fecha = cita.fecha;
      const hora = cita.hora;

      if (fecha) {
        ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + precio;
        const mes = fecha.substring(0, 7);
        ventasPorMes[mes] = (ventasPorMes[mes] || 0) + precio;
      }
      
      if (hora) {
        const h = hora.split(":")[0];
        ventasPorHora[h] = (ventasPorHora[h] || 0) + precio;
      }
    });

    return {
      ventasPorDia,
      ventasPorMes,
      ventasPorHora,
      totalVentas: citas.reduce((acc, c) => acc + Number(c.precio || 0), 0),
      totalCitas: citas.length
    };
  } catch (error) {
    console.error("[METRICAS-SERVER] Error:", error);
    throw error;
  }
}

/**
 * Obtiene citas usando Admin SDK con filtros opcionales.
 */
export async function getCitasPorFechaServer(barberiaId: string, fecha?: string, barberoId?: string, estado?: string) {
  const db = getAdminDb();
  try {
    let query: any = db.collection("barberias").doc(barberiaId).collection("citas");
    
    if (fecha) {
      query = query.where("fecha", "==", fecha);
    }
    
    if (estado) {
      query = query.where("estado", "==", estado);
    }

    if (barberoId && barberoId !== "cualquiera") {
      query = query.where("barbero_id", "==", barberoId);
    }

    if (!fecha && !estado && !barberoId) {
      query = query.limit(100);
    }

    const snapshot = await query.get();
    return snapshot.docs
      .map((doc: DocumentData) => {
        const data = doc.data();
        const bId = data.barbero_id || data.barberoId;
        if (barberoId && barberoId !== "cualquiera" && bId !== barberoId) return null;
        return {
          id: doc.id,
          ...data,
          barberoId: bId,
          clienteId: data.cliente_id || data.clienteId,
        };
      })
      .filter((c: any) => c !== null);
  } catch (error) {
    console.error("[CITAS-SERVER] Error:", error);
    throw error;
  }
}

/**
 * Actualiza el estado de una cita usando Admin SDK.
 */
export async function actualizarEstadoCitaServer(
  barberiaId: string,
  citaId: string,
  estado: string,
  additionalData?: any
) {
  const db = getAdminDb();
  const docRef = db.collection("barberias").doc(barberiaId).collection("citas").doc(citaId);
  const doc = await docRef.get();
  if (!doc.exists) return;
  const cita = doc.data();

  await docRef.update({
    estado,
    ...additionalData,
    actualizado_en: FieldValue.serverTimestamp(),
  });

  // Si se completa la cita, acumular puntos para el cliente
  if (estado === "completada" && cita?.cliente_id) {
    try {
      const { acumularPuntosServer } = await import("./puntos-server");
      const puntosGanados = await acumularPuntosServer(cita.cliente_id, cita.precio || 100);
      console.log(`[CITAS-SERVER] Cliente ${cita.cliente_id} ganó ${puntosGanados} puntos`);
    } catch (e) {
      console.error("[CITAS-SERVER] Error acumulando puntos:", e);
    }
  }

  // Notificar al cliente sobre el cambio de estado
  if (cita?.cliente_id) {
    setTimeout(async () => {
      try {
        const [clienteDoc, barberiaDoc] = await Promise.all([
          db.collection("usuarios").doc(cita.cliente_id).get(),
          db.collection("barberias").doc(barberiaId).get()
        ]);
        
        const clienteNombre = clienteDoc.data()?.nombre || "cliente";
        const barberiaNombre = barberiaDoc.data()?.nombre || "la barbería";

        let title = "Actualización de tu cita";
        let body = `Hola ${clienteNombre}, tu cita en ${barberiaNombre} para el ${cita.fecha} ha sido actualizada a: ${estado}.`;

        if (estado === "confirmada") {
          title = "¡Cita Confirmada! ✂️";
          body = `¡Buenas noticias ${clienteNombre}! Tu cita en ${barberiaNombre} para el ${cita.fecha} a las ${cita.hora} ha sido confirmada. ¡Te esperamos!`;
        } else if (estado === "cancelada_admin") {
          title = "Cita Cancelada ⚠️";
          body = `Lo sentimos ${clienteNombre}, tu cita en ${barberiaNombre} para el ${cita.fecha} ha sido cancelada por la barbería. Por favor, contacta con nosotros para reprogramar.`;
        } else if (estado === "completada") {
          title = "¡Gracias por tu visita! ⭐";
          body = `Esperamos que hayas disfrutado tu servicio en ${barberiaNombre}. ¡Vuelve pronto!`;
        }

        await enviarNotificacionUsuario(cita.cliente_id, { 
          title, 
          body, 
          data: { citaId, estado, barberiaId } 
        });
      } catch (e) {
        console.error("Error en notificaciones de cambio de estado:", e);
      }
    }, 0);
  }
}

/**
 * Cancela una cita usando Admin SDK.
 */
export async function cancelarCitaServer(barberiaId: string, citaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await actualizarEstadoCitaServer(barberiaId, citaId, "cancelada_admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
