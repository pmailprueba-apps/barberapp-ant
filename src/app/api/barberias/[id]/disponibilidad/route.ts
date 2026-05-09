import { NextRequest, NextResponse } from "next/server";
import { disponibilidadPorFecha } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    if (!fecha) {
      return NextResponse.json({ error: "Fecha requerida (YYYY-MM-DD)" }, { status: 400 });
    }

    const slots = await disponibilidadPorFecha(id, fecha);
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error disponibilidad:", error);
    return NextResponse.json({ error: "Error obteniendo disponibilidad" }, { status: 500 });
  }
}
