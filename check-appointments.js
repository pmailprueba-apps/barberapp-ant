const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function checkAppointments() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const envMap = {};
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      envMap[key] = value;
    }
  });

  process.env.FIREBASE_PROJECT_ID = envMap.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  process.env.FIREBASE_CLIENT_EMAIL = envMap.FIREBASE_CLIENT_EMAIL;
  process.env.FIREBASE_PRIVATE_KEY = envMap.FIREBASE_PRIVATE_KEY;

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app);
  const barberiaId = 'barberia_prueba_01';
  const hoy = new Date().toLocaleDateString('sv-SE');
  
  console.log(`--- CITAS DE HOY (${hoy}) PARA ${barberiaId} ---`);
  const citasSnap = await db.collection('barberias').doc(barberiaId).collection('citas').where('fecha', '==', hoy).get();
  
  if (citasSnap.empty) {
    console.log('No hay citas para hoy.');
  } else {
    citasSnap.forEach(doc => {
      console.log(`Cita ID: ${doc.id} | Data:`, JSON.stringify(doc.data(), null, 2));
    });
  }

  console.log('\n--- TODAS LAS CITAS ---');
  const allCitasSnap = await db.collection('barberias').doc(barberiaId).collection('citas').get();
  allCitasSnap.forEach(doc => {
    console.log(`Cita ID: ${doc.id} | Fecha: ${doc.data().fecha} | Estado: ${doc.data().estado}`);
  });
}

checkAppointments().catch(console.error);
