import { NextRequest, NextResponse } from "next/server";
import { getBarberias } from "@/lib/barberias";
import { verifyAuth } from "@/lib/auth-server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const barberias = await getBarberias();
    return NextResponse.json(barberias);
  } catch (error) {
    console.error("Error getBarberias:", error);
    return NextResponse.json({ error: "Error obteniendo barberías" }, { status: 500 });
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

    // 2. Solo superadmin o alguien sin barbería asignada (si el plan lo permite)
    // Por ahora, permitimos a superadmin y a cualquier cliente crear su barbería
    if (user.role !== "superadmin" && user.role !== "cliente" && user.role !== "admin") {
      return NextResponse.json({ error: "No tienes permisos para crear una barbería" }, { status: 403 });
    }

    const body = await request.json();
    const db = getAdminDb();
    
    // Validar campos básicos
    if (!body.nombre) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
    }

    // 3. Crear en Firestore usando Admin SDK
    const newBarberia = {
      ...body,
      creada_en: new Date(),
      estado: body.estado || "activa",
      creado_por: user.uid
    };

    const docRef = await db.collection("barberias").add(newBarberia);
    const barberiaId = docRef.id;

    // 4. Si el creador no es superadmin, promocionarlo a admin de esta barbería
    if (user.role !== "superadmin") {
      const auth = getAdminAuth();
      await auth.setCustomUserClaims(user.uid, {
        role: "admin",
        barberia_id: barberiaId
      });

      // Sincronizar en Firestore
      await db.collection("usuarios").doc(user.uid).set({
        role: "admin",
        barberia_id: barberiaId,
        updatedAt: new Date(),
      }, { merge: true });
      
      console.log(`Auth Security: User ${user.uid} promoted to admin of new barberia ${barberiaId}`);
    }

    return NextResponse.json({ id: barberiaId });
  } catch (error: any) {
    console.error("Error createBarberia:", error);
    return NextResponse.json({ 
      error: "Error creando barbería", 
      details: error.message 
    }, { status: 500 });
  }
}

