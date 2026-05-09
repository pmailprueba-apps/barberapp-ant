import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAdminAuth } from "@/lib/firebase-admin";

// Registrar un evento en el log
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);

    if (decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Solo Super Admin" }, { status: 403 });
    }

    const body = await request.json();
    const { tipo, mensaje, entidad_id, entidad_nombre } = body;

    if (!tipo || !mensaje) {
      return NextResponse.json({ error: "tipo y mensaje requeridos" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "log_plataforma"), {
      tipo, // "barberia" | "usuario" | "pago" | "cita" | "sistema"
      mensaje,
      entidad_id: entidad_id || null,
      entidad_nombre: entidad_nombre || null,
      usuario_id: decoded.uid,
      usuario_email: decoded.email || "desconocido",
      rol: decoded.role,
      fecha: serverTimestamp(),
      metadata: body.metadata || {},
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error("Error creando log:", error);
    return NextResponse.json({ error: "Error creando log" }, { status: 500 });
  }
}

// Obtener logs (con filtros opcionales)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAdminAuth().verifyIdToken(token);

    if (decoded.role !== "superadmin") {
      return NextResponse.json({ error: "Solo Super Admin" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const limite = parseInt(searchParams.get("limit") || "50");

    let q = query(collection(db, "log_plataforma"), orderBy("fecha", "desc"), limit(limite));

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        tipo: data.tipo,
        mensaje: data.mensaje,
        entidad_id: data.entidad_id,
        entidad_nombre: data.entidad_nombre,
        usuario_email: data.usuario_email,
        rol: data.rol,
        fecha: data.fecha?.toDate?.() || new Date(),
        metadata: data.metadata || {},
      };
    });

    // Filtrar por tipo si se pide
    const filtrados = tipo ? logs.filter((l) => l.tipo === tipo) : logs;

    return NextResponse.json(filtrados);
  } catch (error) {
    console.error("Error getLogs:", error);
    return NextResponse.json({ error: "Error obteniendo logs" }, { status: 500 });
  }
}