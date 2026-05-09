import { NextRequest, NextResponse } from "next/server";
import { updateBarberia } from "@/lib/barberias";
import { uploadLogo } from "@/lib/storage";
import { verifyAuth } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticación
    const user = await verifyAuth(request);
    const isOwner = user.role === "admin" && user.barberia_id === id;
    const isSuper = user.role === "superadmin";

    if (!isOwner && !isSuper) {
      return NextResponse.json({ error: "No tienes permisos para cambiar el logo de esta barbería" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });
    }

    const logoUrl = await uploadLogo(id, file);
    await updateBarberia(id, { logo: logoUrl });

    return NextResponse.json({ url: logoUrl });
  } catch (error: any) {
    console.error("Error uploadLogo:", error);
    return NextResponse.json({ error: error.message || "Error subiendo logo" }, { status: error.message?.includes("token") ? 401 : 500 });
  }
}
