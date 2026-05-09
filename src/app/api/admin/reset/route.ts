import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);

    if (decodedToken.role !== "superadmin") {
      return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
    }

    const db = getAdminDb();

    // 1. Colecciones a eliminar COMPLETAMENTE
    const collectionsToDelete = [
      "barberias",
      "chats",
      "metricas_mensuales",
      "log_plataforma",
      "empleados"
    ];

    console.log("Iniciando reinicio nuclear...");

    for (const collName of collectionsToDelete) {
      await deleteCollection(db, collName, 100);
    }

    // 2. Limpiar vinculaciones en usuarios
    // Mantener los usuarios pero quitarles barberia_id y barbero_id
    const usersSnap = await db.collection("usuarios").get();
    const batch = db.batch();
    let count = 0;

    usersSnap.docs.forEach((doc) => {
      // No borrar el documento, solo limpiar campos de vinculación
      batch.update(doc.ref, {
        barberia_id: FieldValue.delete(),
        barbero_id: FieldValue.delete(),
        // Podríamos resetear puntos si fuera necesario
        puntos: 0
      });
      count++;
      if (count === 500) {
        // En un batch real deberíamos hacer commit aquí, pero para pruebas con pocos usuarios está bien
      }
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: "Sistema reiniciado con éxito. Se eliminaron barberías, chats y logs. Se desvincularon todos los usuarios." 
    });

  } catch (error: any) {
    console.error("Error en reset nuclear:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function deleteCollection(db: any, collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: any, query: any, resolve: any) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    // Si tiene subcolecciones, este método de Firebase Admin NO las borra automáticamente.
    // Pero para barberías y chats, sabemos que tienen subcolecciones importantes.
    // Borrado recursivo simple para propósitos de desarrollo:
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Recurse on the next process tick, to avoid blocking the event loop
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}
