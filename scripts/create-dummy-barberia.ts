import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function createDummyBarberia() {
  console.log("Creando Barbería de Prueba...");
  try {
    await db.collection("barberias").doc("barberia_prueba_01").set({
      nombre: "Barbería de Prueba",
      estado: "activa",
      direccion: "Calle Falsa 123",
      createdAt: new Date(),
    }, { merge: true });
    console.log("✅ Barbería creada y activada correctamente.");
  } catch (error) {
    console.error("❌ Error creando barbería:", error);
  }
  process.exit(0);
}

createDummyBarberia();
