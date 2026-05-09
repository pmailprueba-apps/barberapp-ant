const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Intentar leer el service account de la carpeta del proyecto
// Usualmente está en .env.local o similar, pero aquí el código usa variables de entorno
// Vamos a usar el mismo método que el servidor

async function checkUsers() {
  // Simular el entorno de Next.js para usar firebase-admin
  // Necesitamos las variables de entorno
  const env = fs.readFileSync('.env.local', 'utf8');
  const envMap = {};
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remover comillas si existen
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      envMap[key] = value;
    }
  });

  process.env.FIREBASE_PROJECT_ID = envMap.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  process.env.FIREBASE_CLIENT_EMAIL = envMap.FIREBASE_CLIENT_EMAIL;
  process.env.FIREBASE_PRIVATE_KEY = envMap.FIREBASE_PRIVATE_KEY;

  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('No se pudo encontrar las variables de entorno');
    return;
  }

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app);
  
  console.log('--- USUARIOS ---');
  const usersSnap = await db.collection('usuarios').get();
  usersSnap.forEach(doc => {
    console.log(`UID: ${doc.id} | Email: ${doc.data().email} | Role: ${doc.data().role} | Barberia: ${doc.data().barberia_id}`);
  });

  console.log('\n--- BUSCANDO admin@prueba.com ---');
  const specificUser = await db.collection('usuarios').where('email', '==', 'admin@prueba.com').get();
  if (specificUser.empty) {
    console.log('No se encontró el usuario admin@prueba.com en Firestore');
  } else {
    specificUser.forEach(doc => {
      console.log(`ENCONTRADO: UID: ${doc.id} | Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }

  console.log('\n--- BARBERIAS ---');
  const barbSnap = await db.collection('barberias').get();
  barbSnap.forEach(doc => {
    console.log(`ID: ${doc.id} | Nombre: ${doc.data().nombre}`);
  });
}

checkUsers().catch(console.error);
