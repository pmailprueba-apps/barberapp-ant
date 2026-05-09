import { NextRequest, NextResponse } from "next/server";
import { toggleServicioActivo, updateServicioActivo } from "@/lib/servicios";
import { verifyAuth } from "@/lib/auth-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  try {
    const { id, sid } = await params;

    // 1. Verificar autenticación y autorización
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    // Solo barberos/admins de ESTA barbería pueden modificar servicios
    if (user.barberia_id !== id) {
      return NextResponse.json({ error: "No tienes permiso para modificar servicios de otra barbería" }, { status: 403 });
    }

    if (user.role === "cliente") {
      return NextResponse.json({ error: "Los clientes no pueden modificar servicios" }, { status: 403 });
    }

    const body = await request.json();

    if (typeof body.activo === "boolean") {
      await toggleServicioActivo(id, sid, body.activo);
    }

    if (body.precio !== undefined || body.duracion_min !== undefined) {
      await updateServicioActivo(id, sid, {
        precio: body.precio,
        duracion_min: body.duracion_min,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error toggleServicio:", error);
    return NextResponse.json({ 
      error: "Error actualizando servicio",
      message: error.message 
    }, { status: 500 });
  }
}
