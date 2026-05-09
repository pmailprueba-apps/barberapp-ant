import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { Role } from "@/types/roles";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const role = (decodedToken.role as Role) || null;
    const barberia_id = decodedToken.barberia_id || null;
    const barbero_id = decodedToken.barbero_id || null;

    return NextResponse.json({
      uid,
      email: decodedToken.email || null,
      role,
      barberia_id,
      barbero_id,
      nombre: decodedToken.name || null,
    });
  } catch (error) {
    console.error("Error /me:", error);
    return NextResponse.json({ error: "Error obteniendo usuario" }, { status: 500 });
  }
}
