import { NextRequest, NextResponse } from "next/server";
import { getPuntosUsuario, canjearPuntos } from "@/lib/puntos";
import { getAdminAuth } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-server";



export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    const uid = user.uid;


    const puntos = await getPuntosUsuario(uid);
    return NextResponse.json({ puntos });
  } catch (error) {
    console.error("Error getPuntos:", error);
    return NextResponse.json({ error: "Error obteniendo puntos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    const uid = user.uid;


    const body = await request.json();
    const { puntosRequeridos } = body;

    if (!puntosRequeridos || typeof puntosRequeridos !== "number") {
      return NextResponse.json({ error: "puntosRequeridos requerido" }, { status: 400 });
    }

    const resultado = await canjearPuntos(uid, puntosRequeridos);

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canjearPuntos:", error);
    return NextResponse.json({ error: "Error canjeando puntos" }, { status: 500 });
  }
}