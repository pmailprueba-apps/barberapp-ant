import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getBarberiaPorSlug } from "@/lib/barberias";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const barberia = await getBarberiaPorSlug(slug);

    if (!barberia) {
      return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
    }

    return NextResponse.json(barberia);
  } catch (error) {
    console.error("Error getBarberiaPorSlug:", error);
    return NextResponse.json({ error: "Error obteniendo barbería" }, { status: 500 });
  }
}