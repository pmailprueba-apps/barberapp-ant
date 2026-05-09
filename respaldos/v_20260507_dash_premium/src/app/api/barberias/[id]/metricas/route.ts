import { NextRequest, NextResponse } from "next/server";
import { getMetricasNegocioServer } from "@/lib/citas-server";
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
      return NextResponse.json({ error: "No tienes permiso para ver las métricas de otra barbería" }, { status: 403 });
    }

    // El cliente no debería ver métricas del negocio
    if (user.role === "cliente") {
       return NextResponse.json({ error: "Acceso denegado: rol no autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const barberoId = searchParams.get("barberoId") || undefined;
    const stats = await getMetricasNegocioServer(id, barberoId);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error getMetricas:", error);
    return NextResponse.json({ 
      error: "Error obteniendo métricas",
      message: error.message 
    }, { status: 500 });
  }
}
