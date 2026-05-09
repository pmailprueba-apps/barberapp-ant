import { NextRequest, NextResponse } from "next/server";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { enviarConfirmacionCita, enviarRecordatorio, enviarCampañaMasiva } from "@/lib/whatsapp";
import { getAdminAuth } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-server";


type MensajeTipo = "confirmacion" | "recordatorio" | "aviso_pago" | "campaña";

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { tipo, barberiaId, fecha, telefonos, template, data } = body as {
      tipo: MensajeTipo;
      barberiaId?: string;
      fecha?: string;
      telefonos?: string[];
      template?: string;
      data?: Record<string, string>;
    };

    // 2. Si es admin, verificar que la barbería le pertenece
    if (user.role === "admin" && barberiaId && user.barberia_id !== barberiaId) {
      return NextResponse.json({ error: "No tienes permiso para enviar mensajes desde esta barbería" }, { status: 403 });
    }


    switch (tipo) {
      case "confirmacion": {
        if (!barberiaId || !fecha) {
          return NextResponse.json({ error: "barberiaId y fecha requeridos" }, { status: 400 });
        }
        // Obtener citas de la fecha
        const citasQuery = query(
          collection(db, "barberias", barberiaId, "citas"),
          where("fecha", "==", fecha)
        );
        const snapshot = await getDocs(citasQuery);
        let enviados = 0;
        for (const doc of snapshot.docs) {
          const d = doc.data();
          if (d.estado === "cancelada_cliente" || d.estado === "cancelada_admin") continue;
          await enviarConfirmacionCita({
            telefono: d.cliente_telefono || "",
            nombre: d.cliente_nombre || "Cliente",
            fecha: d.fecha || "",
            hora: d.hora || "",
            servicio: d.servicio_nombre || "",
            barbero: d.barbero_nombre || "",
          });
          enviados++;
        }
        return NextResponse.json({ success: true, enviados });
      }

      case "recordatorio": {
        if (!barberiaId) {
          return NextResponse.json({ error: "barberiaId requerido" }, { status: 400 });
        }
        // Buscar citas en rango de 60-90 min desde ahora sin recordatorio
        const ahora = new Date();
        const en60min = new Date(ahora.getTime() + 60 * 60000);
        const en90min = new Date(ahora.getTime() + 90 * 60000);

        // Obtener todas las citas del día
        const hoy = new Date().toISOString().split("T")[0];
        const citasQuery = query(
          collection(db, "barberias", barberiaId, "citas"),
          where("fecha", "==", hoy)
        );
        const snapshot = await getDocs(citasQuery);
        let enviados = 0;

        for (const doc of snapshot.docs) {
          const d = doc.data();
          if (d.recordatorio_enviado_en) continue;
          if (d.estado !== "confirmada" && d.estado !== "pendiente") continue;

          const [h, m] = (d.hora || "").split(":").map(Number);
          const citaFechaHora = new Date(`${d.fecha}T${d.hora}`);
          if (citaFechaHora >= en60min && citaFechaHora <= en90min) {
            await enviarRecordatorio({
              telefono: d.cliente_telefono || "",
              nombre: d.cliente_nombre || "Cliente",
              fecha: d.fecha || "",
              hora: d.hora || "",
              servicio: d.servicio_nombre || "",
            });
            enviados++;
          }
        }
        return NextResponse.json({ success: true, enviados });
      }

      case "campaña": {
        if (!telefonos || !template || !data) {
          return NextResponse.json({ error: "telefonos, template, data requeridos" }, { status: 400 });
        }
        const resultado = await enviarCampañaMasiva({ telefonos, template, data });
        return NextResponse.json(resultado);
      }

      default:
        return NextResponse.json({ error: "Tipo de mensaje no soportado" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error enviando mensajes:", error);
    return NextResponse.json({ error: "Error enviando mensajes" }, { status: 500 });
  }
}