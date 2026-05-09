import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth-server";


/**
 * Endpoint para resetear la base de datos a un estado inicial.
 * Borra barberías, citas, servicios, logs, pero MANTIENE los usuarios (cuentas).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar Autorización (Solo Super Admin)
    let user;
    try {
      user = await verifyAuth(request);
    } catch (authError: any) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (user.role !== "superadmin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    console.log(`[RESET] Iniciando borrado masivo por SuperAdmin: ${user.email}`);


    const db = getAdminDb();

    // 2. Borrar Colecciones Principales (Recursivo)
    const collectionsToWipe = ["barberias", "log_plataforma", "empleados", "transacciones", "chats", "metricas_mensuales"];
    
    for (const colName of collectionsToWipe) {
      console.log(`[RESET] Borrando colección: ${colName}`);
      const ref = db.collection(colName);
      // Firebase Admin SDK recursiveDelete es la forma más limpia
      await db.recursiveDelete(ref);
    }

    // 3. Limpiar Usuarios (Resetear vínculos pero mantener la cuenta)
    console.log(`[RESET] Limpiando datos de usuarios...`);
    const usuariosRef = db.collection("usuarios");
    const usuariosSnap = await usuariosRef.get();
    
    // Usamos batches para eficiencia (límite 500 por batch)
    let count = 0;
    let batch = db.batch();

    for (const doc of usuariosSnap.docs) {
      // a. Resetear campos de vinculación
      batch.update(doc.ref, {
        barberia_id: null,
        barberiaId: null,
        barbero_id: null,
        sucursal_id: null,
        actualizado_en: new Date()
      });

      // b. Borrar subcolección de notificaciones de cada usuario
      const notifRef = doc.ref.collection("notificaciones");
      await db.recursiveDelete(notifRef);

      count++;
      if (count >= 400) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }

    console.log(`[RESET] Sistema reiniciado exitosamente.`);

    return NextResponse.json({ 
      success: true, 
      message: "Sistema reiniciado. Se mantuvieron las cuentas de usuario pero se eliminaron todos los datos operativos." 
    });

  } catch (error: any) {
    console.error("[RESET-ERROR]:", error);
    return NextResponse.json({ 
      error: "Error durante el reinicio", 
      details: error.message 
    }, { status: 500 });
  }
}
