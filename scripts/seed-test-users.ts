import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
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

const auth = getAuth();
const db = getFirestore();

const testUsers = [
  { role: "superadmin", email: "superadmin@prueba.com", pass: "Prueba123!", name: "Tester SuperAdmin" },
  { role: "admin", email: "admin@prueba.com", pass: "Prueba123!", name: "Tester Admin" },
  { role: "barbero", email: "barbero@prueba.com", pass: "Prueba123!", name: "Tester Barbero" },
  { role: "cliente", email: "cliente@prueba.com", pass: "Prueba123!", name: "Tester Cliente" },
];

async function seedTestUsers() {
  console.log("🌱 Iniciando creación de usuarios de prueba...");

  for (const user of testUsers) {
    let uid;
    try {
      // Intentar obtener el usuario por correo
      const existingUser = await auth.getUserByEmail(user.email);
      uid = existingUser.uid;
      // Actualizar la contraseña por si acaso
      await auth.updateUser(uid, { password: user.pass });
      console.log(`✅ [Auth] Usuario ${user.email} actualizado.`);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        // Si no existe, crearlo
        const newUser = await auth.createUser({
          email: user.email,
          password: user.pass,
          displayName: user.name,
        });
        uid = newUser.uid;
        console.log(`✅ [Auth] Usuario ${user.email} creado.`);
      } else {
        console.error(`❌ [Auth] Error con ${user.email}:`, error);
        continue;
      }
    }

    // Set Custom Claims para que el hook useAuth funcione bien
    const barberiaId = user.role === "admin" || user.role === "barbero" ? "barberia_prueba_01" : null;
    try {
      await auth.setCustomUserClaims(uid, {
        role: user.role,
        ...(barberiaId ? { barberia_id: barberiaId } : {})
      });
      console.log(`✅ [Claims] Claims establecidos para ${user.email}`);
    } catch (claimError) {
      console.error(`❌ [Claims] Error con ${user.email}:`, claimError);
    }

    // Crear/Actualizar en Firestore
    try {
      // Super admin va a un lugar o no? En nuestro sistema el rol está en "empleados" o "users"?
      // Voy a crear el registro genérico en la colección principal para no tener problemas
      // Según tu estructura es /users o /empleados
      // Lo pondremos en la ruta estandar:
      const docRef = db.collection("empleados").doc(uid);
      await docRef.set({
        uid: uid,
        email: user.email,
        nombre: user.name,
        rol: user.role,
        createdAt: new Date(),
        testAccount: true,
        // Al admin le asignamos una barberia dummy, al barbero tambien
        barberiaId: user.role === "admin" || user.role === "barbero" ? "barberia_prueba_01" : null,
      }, { merge: true });

      console.log(`✅ [Firestore] Documento guardado para ${user.email} con rol: ${user.role}`);
    } catch (dbError) {
      console.error(`❌ [Firestore] Error guardando ${user.email}:`, dbError);
    }
  }

  console.log("🚀 ¡Todos los usuarios de prueba están listos!");
  process.exit(0);
}

seedTestUsers();
