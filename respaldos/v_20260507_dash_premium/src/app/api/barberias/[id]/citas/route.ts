import { NextRequest, NextResponse } from "next/server";
import { crearCitaServer } from "@/lib/citas-server";
import { getCitasPorFechaServer, cancelarCitaServer, actualizarEstadoCitaServer } from "@/lib/citas-server";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");
    const barberoId = searchParams.get("barberoId");
    const estado = searchParams.get("estado");

    // Verificar autenticación
    const user = await verifyAuth(request);
    
    // Seguridad: Barbero o Admin solo pueden ver citas de su propia barbería
    const isSuper = user.role === "superadmin";
    const isOfThisBarberia = user.barberia_id === id;
    const isStaff = user.role === "admin" || user.role === "barbero";

    if (!isSuper && (!isOfThisBarberia || !isStaff)) {
      return NextResponse.json({ error: "No tienes permiso para ver citas de esta barbería" }, { status: 403 });
    }

    console.log(`[API GET] Citas para barberia: ${id}, fecha: ${fecha}, barbero: ${barberoId}, estado: ${estado}`);

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json({ error: "Faltan parámetros (ID requerido)" }, { status: 400 });
    }

    const citasRaw = await getCitasPorFechaServer(id, fecha || undefined, barberoId || undefined, estado || undefined);
    
    // Enriquecer con nombres de clientes y barberos
    const { getAdminDb } = await import("@/lib/firebase-admin");
    const dbAdmin = getAdminDb();
    
    const citas = await Promise.all(citasRaw.map(async (cita: any) => {
      let clienteNombre = "Cliente";
      let barberoNombre = "Barbero";
      
      try {
        if (cita.clienteId) {
          const uDoc = await dbAdmin.collection("usuarios").doc(cita.clienteId).get();
          if (uDoc.exists) clienteNombre = uDoc.data()?.nombre || "Cliente";
        }
        if (cita.barberoId) {
          const bDoc = await dbAdmin.collection("usuarios").doc(cita.barberoId).get();
          if (bDoc.exists) barberoNombre = bDoc.data()?.nombre || "Barbero";
        }
      } catch (e) {
        console.error("Error al enriquecer cita:", e);
      }
      
      return {
        ...cita,
        cliente_nombre: clienteNombre,
        barbero_nombre: barberoNombre
      };
    }));

    return NextResponse.json(citas);
  } catch (error: any) {
    console.error("[API GET ERROR] /api/barberias/[id]/citas:", error);
    return NextResponse.json({ 
      error: error.message || "Error interno",
      details: error.toString()
    }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const user = await verifyAuth(request);
    const body = await request.json();
    const { clienteId, barberoId, servicioId, fecha, hora, precio, servicioNombre, duracionMin } = body;

    if (!clienteId || !barberoId || !servicioId || !fecha || !hora) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Seguridad: 
    // 1. Un cliente solo puede reservar para sí mismo
    // 2. Un admin/barbero puede reservar para cualquier cliente PERO solo en su barbería
    const isSuper = user.role === "superadmin";
    const isStaffOfBarberia = (user.role === "admin" || user.role === "barbero") && user.barberia_id === id;
    const isSelfBooking = user.uid === clienteId;

    if (!isSuper && !isStaffOfBarberia && !isSelfBooking) {
      return NextResponse.json({ error: "No tienes permiso para crear esta cita" }, { status: 403 });
    }

    console.log(`[API] POST Reserva para ${fecha} ${hora} - Usando Admin SDK...`);

    const result = await crearCitaServer(id, {
      clienteId,
      barberoId,
      servicioId,
      fecha,
      hora,
      precio,
      servicioNombre,
      duracionMin
    });

    if (!result.success) {
      return NextResponse.json({ error: (result as any).error || "Error al crear cita" }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[API ERROR] Reservar:", error.message);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: error.message?.includes("token") ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const citaId = searchParams.get("citaId");

    if (!citaId) {
      return NextResponse.json({ error: "citaId requerido" }, { status: 400 });
    }

    // Verificar autenticación
    const user = await verifyAuth(request);
    
    // Solo admins o barberos de ESTA barbería o superadmin pueden cancelar
    const isSuper = user.role === "superadmin";
    const isStaffOfBarberia = (user.role === "admin" || user.role === "barbero") && user.barberia_id === id;

    if (!isSuper && !isStaffOfBarberia) {
      // Si es un cliente, solo puede cancelar si es SU cita (esto requiere buscar la cita primero)
      // Por ahora, el dashboard de admin usa este endpoint. El cliente usa otro o está bloqueado aquí.
      return NextResponse.json({ error: "No tienes permiso para realizar esta acción" }, { status: 403 });
    }

    const resultado = await cancelarCitaServer(id, citaId);

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error cancelarCita:", error);
    return NextResponse.json({ error: error.message || "Error cancelando cita" }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barberiaId } = await params;
    const { searchParams } = new URL(request.url);
    const citaId = searchParams.get("citaId");
    const body = await request.json();
    const { estado, ...additionalData } = body;

    if (!citaId || !estado) {
      return NextResponse.json({ error: "citaId y estado son requeridos" }, { status: 400 });
    }

    // Verificar autenticación
    const user = await verifyAuth(request);
    
    const isSuper = user.role === "superadmin";
    const isStaffOfBarberia = (user.role === "admin" || user.role === "barbero") && user.barberia_id === barberiaId;

    if (!isSuper && !isStaffOfBarberia) {
      return NextResponse.json({ error: "No tienes permiso para realizar esta acción" }, { status: 403 });
    }

    await actualizarEstadoCitaServer(barberiaId, citaId, estado, additionalData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updateCitaStatus:", error);
    return NextResponse.json({ error: error.message || "Error actualizando estado de cita" }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}
