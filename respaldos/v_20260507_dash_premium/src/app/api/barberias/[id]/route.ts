import { NextRequest, NextResponse } from "next/server";
import { getBarberia, updateBarberia, deleteBarberia } from "@/lib/barberias";
import { verifyAuth } from "@/lib/auth-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const barberia = await getBarberia(id);
    if (!barberia) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }
    return NextResponse.json(barberia);
  } catch (error) {
    console.error("Error getBarberia:", error);
    return NextResponse.json({ error: "Error obteniendo barbería" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);

    // Solo admin de esta barbería o superadmin pueden actualizar
    const isOwner = user.role === "admin" && user.barberia_id === id;
    const isSuper = user.role === "superadmin";

    if (!isOwner && !isSuper) {
      return NextResponse.json({ error: "No tienes permisos para actualizar esta barbería" }, { status: 403 });
    }

    const body = await request.json();
    await updateBarberia(id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updateBarberia:", error);
    return NextResponse.json({ error: error.message || "Error actualizando barbería" }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuth(request);

    // Solo superadmin puede eliminar barberías (borrado físico/total)
    if (user.role !== "superadmin") {
      return NextResponse.json({ error: "Solo el administrador global puede eliminar barberías" }, { status: 403 });
    }

    await deleteBarberia(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleteBarberia:", error);
    return NextResponse.json({ error: error.message || "Error eliminando barbería" }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}
