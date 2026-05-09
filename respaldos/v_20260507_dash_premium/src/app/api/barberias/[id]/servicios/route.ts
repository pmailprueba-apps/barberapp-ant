import { NextRequest, NextResponse } from "next/server";
import { getServiciosActivos, addServicioActivo, inicializarServiciosDefault } from "@/lib/servicios";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const servicios = await getServiciosActivos(id);
    return NextResponse.json(servicios);
  } catch (error) {
    console.error("Error getServicios:", error);
    return NextResponse.json({ error: "Error obteniendo servicios" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Verificar autenticación y autorización
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    // Solo barberos/admins de ESTA barbería pueden modificar servicios.
    // Superadmin tiene acceso total.
    const isOwner = user.barberia_id === id;
    const isSuperAdmin = user.role === "superadmin";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "No tienes permiso para modificar servicios de esta barbería" }, { status: 403 });
    }

    // El rol 'cliente' (usuario final) nunca puede modificar servicios
    if (user.role === "cliente" && !isSuperAdmin) {
      return NextResponse.json({ error: "Los clientes no pueden modificar servicios" }, { status: 403 });
    }


    const body = await request.json();

    if (body.inicializar) {
      await inicializarServiciosDefault(id);
      return NextResponse.json({ success: true, message: "Servicios inicializados" });
    }

    const { servicioId } = body;
    const docId = await addServicioActivo(id, servicioId);
    return NextResponse.json({ id: docId });
  } catch (error: any) {
    console.error("Error addServicio:", error);
    return NextResponse.json({ 
      error: "Error agregando servicio",
      message: error.message 
    }, { status: 500 });
  }
}
