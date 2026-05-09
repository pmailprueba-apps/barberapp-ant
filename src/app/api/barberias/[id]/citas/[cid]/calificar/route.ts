import { NextRequest, NextResponse } from "next/server";
import { calificarCita } from "@/lib/citas";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);
    const { id: barberiaId, cid: citaId } = await params;

    // Solo el cliente de la cita o admins pueden calificar
    const body = await request.json();
    const { calificacion, comentario } = body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json({ error: "Calificación inválida (1-5)" }, { status: 400 });
    }

    await calificarCita(barberiaId, citaId, calificacion, comentario);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error calificarCita:", error);
    return NextResponse.json({ error: "Error calificando cita" }, { status: 500 });
  }
}