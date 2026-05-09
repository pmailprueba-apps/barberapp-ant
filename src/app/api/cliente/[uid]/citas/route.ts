import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-server";


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    // 1. Verificar autenticación
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    const { uid } = await params;

    // Solo el propio usuario o un superadmin pueden ver estas citas
    if (user.uid !== uid && user.role !== "superadmin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }


    const db = getAdminDb();
    console.log(`[API-CLIENTE] Buscando citas para cliente: ${uid}`);
    
    let snapshot;
    try {
      // Intento 1: Con ordenamiento (requiere índice)
      snapshot = await db.collectionGroup("citas")
        .where("cliente_id", "==", uid)
        .orderBy("fecha", "desc")
        .get();
    } catch (e: any) {
      if (e.message.includes("FAILED_PRECONDITION")) {
        console.warn("[API-CLIENTE] Índice de collectionGroup no encontrado. Usando fallback sin ordenamiento.");
        // Intento 2: Sin ordenamiento (luego ordenamos en memoria)
        snapshot = await db.collectionGroup("citas")
          .where("cliente_id", "==", uid)
          .get();
      } else {
        throw e;
      }
    }

    const citas = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        const barberiaId = data.barberia_id || d.ref.parent.parent?.id;

        // Obtener nombres de forma segura
        let barberoNombre = "Barbero";
        let barberiaNombre = "Barbería";

        if (data.barbero_id) {
          try {
            const bDoc = await db.collection("usuarios").doc(data.barbero_id).get();
            if (bDoc.exists) barberoNombre = bDoc.data()?.nombre || "Barbero";
          } catch {}
        }

        if (barberiaId) {
          try {
            const bbDoc = await db.collection("barberias").doc(barberiaId).get();
            if (bbDoc.exists) barberiaNombre = bbDoc.data()?.nombre || "Barbería";
          } catch {}
        }

        return {
          id: d.id,
          barberia_id: barberiaId,
          barberia_nombre: barberiaNombre,
          barbero_nombre: barberoNombre,
          servicio_nombre: data.servicio_nombre || "Servicio",
          fecha: data.fecha,
          hora: data.hora,
          precio: data.precio || 0,
          duracion_min: data.duracion_min || 30,
          estado: data.estado,
          calificacion: data.calificacion || null,
          creado_en: data.creado_en
        };
      })
    );

    // Si usamos el fallback, ordenamos en memoria
    citas.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(citas);
  } catch (error: any) {
    console.error("Error getCitasCliente:", error);
    return NextResponse.json({ error: "Error obteniendo citas" }, { status: 500 });
  }
}