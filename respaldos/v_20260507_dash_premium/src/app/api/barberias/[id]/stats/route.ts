import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Verificar autenticación
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    // 2. Verificar autorización (que el barbero pertenezca a esta barbería)
    if (user.role === "barbero" && user.barberia_id !== id) {
      return NextResponse.json({ error: "No tienes permiso para ver las estadísticas de otra barbería" }, { status: 403 });
    }

    // El cliente no debería ver estadísticas de la barbería
    if (user.role === "cliente") {
       return NextResponse.json({ error: "Acceso denegado: rol no autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fechaParam = searchParams.get("fecha");

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID de barbería no válido" }, { status: 400 });
    }

    const db = getAdminDb();
    const hoy = fechaParam || new Date().toISOString().split("T")[0];

    const barberiaRef = db.collection("barberias").doc(id);
    const barberiaDoc = await barberiaRef.get();

    if (!barberiaDoc.exists) {
      console.warn(`[STATS API] Barberia no encontrada: ${id}`);
      return NextResponse.json({ error: "Barbería no encontrada", id }, { status: 404 });
    }

    console.log(`[STATS API] Obteniendo stats para ${id} (${barberiaDoc.data()?.nombre}) el día ${hoy}`);

    // Citas de hoy
    const citasRef = barberiaRef.collection("citas");
    const citasSnapshot = await citasRef
      .where("fecha", "==", hoy)
      .get();

    const citasHoy = citasSnapshot.size;

    // Ingresos de hoy (citas completadas o confirmadas)
    let ingresosHoy = 0;
    const clientesSet = new Set<string>();
    const barberosSet = new Set<string>();

    citasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const estado = data.estado || "";
      
      // Contar ingresos si está confirmada o completada
      if (estado === "completada" || estado === "confirmada") {
        ingresosHoy += Number(data.precio || 0);
      }

      // Track clientes y barberos activos hoy
      const cId = data.cliente_id || data.clienteId;
      const bId = data.barbero_id || data.barberoId;
      if (cId) clientesSet.add(cId);
      if (bId) barberosSet.add(bId);
    });

    // Totales (Barberos y Clientes registrados en la barbería)
    const barberosTotalSnapshot = await db.collection("usuarios")
      .where("barberia_id", "==", id)
      .where("role", "==", "barbero")
      .get();
    
    const barberosTotal = barberosTotalSnapshot.size;

    return NextResponse.json({
      citasHoy,
      ingresosHoy,
      clientesActivos: clientesSet.size || 0,
      barberosActivos: barberosTotal || barberosSet.size || 0,
      debug: {
        id,
        hoy,
        citasEncontradas: citasSnapshot.size
      }
    });
  } catch (error: any) {
    const { id } = await params;
    console.error(`[STATS API ERROR] Barberia ${id}:`, error);
    return NextResponse.json({ 
      error: "Error obteniendo stats", 
      message: error.message,
    }, { status: 500 });
  }
}