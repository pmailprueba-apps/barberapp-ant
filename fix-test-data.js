const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

async function fixData() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const envMap = {};
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envMap[match[1].trim()] = match[2].trim().replace(/^\"|\"$/g, '');
    }
  });

  const app = initializeApp({
    credential: cert({
      projectId: envMap.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: envMap.FIREBASE_CLIENT_EMAIL,
      privateKey: envMap.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app);
  const auth = getAuth(app);

  const testEmails = ['admin@prueba.com', 'barbero@prueba.com'];
  const BARBERIA_ID = 'barberia_prueba_01';
  const BARBERO_ID = 'barbero_prueba_01';

  console.log('--- Buscando usuarios en Auth ---');
  const userUids = {};
  for (const email of testEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      userUids[email] = user.uid;
      console.log(`Email: ${email} -> UID: ${user.uid}`);
    } catch (error) {
      console.error(`Error buscando ${email}:`, error.message);
    }
  }

  if (userUids['admin@prueba.com']) {
    console.log('\n--- Creando/Actualizando documento de ADMIN en Firestore ---');
    await db.collection('usuarios').doc(userUids['admin@prueba.com']).set({
      email: 'admin@prueba.com',
      role: 'admin',
      barberia_id: BARBERIA_ID,
      nombre: 'Administrador de Prueba',
      activo: true,
      actualizado_en: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Admin actualizado.');
  }

  if (userUids['barbero@prueba.com']) {
    console.log('\n--- Creando/Actualizando documento de BARBERO en Firestore ---');
    // 1. Asegurar que el barbero existe en la subcolección de la barbería
    await db.collection('barberias').doc(BARBERIA_ID).collection('barberos').doc(BARBERO_ID).set({
      nombre: 'Barbero de Prueba',
      especialidad: 'Corte Clásico',
      activo: true,
      uid: userUids['barbero@prueba.com'], // Vincular UID
      actualizado_en: FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Crear documento de usuario
    await db.collection('usuarios').doc(userUids['barbero@prueba.com']).set({
      email: 'barbero@prueba.com',
      role: 'barbero',
      barberia_id: BARBERIA_ID,
      barbero_id: BARBERO_ID,
      nombre: 'Barbero de Prueba',
      activo: true,
      actualizado_en: FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Barbero actualizado.');
  }

  console.log('\n--- Creando algunas citas de prueba para que haya métricas ---');
  const hoy = new Date();
  const fechaHoy = hoy.toISOString().split('T')[0];
  
  const citasRef = db.collection('barberias').doc(BARBERIA_ID).collection('citas');
  
  // Crear 3 citas para hoy
  const estados = ['confirmada', 'completada', 'pendiente'];
  const adminUid = userUids['admin@prueba.com'];

  for (let i = 0; i < 3; i++) {
    await citasRef.add({
      cliente_id: adminUid, // Usar el UID del admin como cliente para que el enriquecimiento funcione
      cliente_nombre: `Admin (Cliente ${i+1})`,
      barbero_id: BARBERO_ID,
      barbero_nombre: 'Barbero de Prueba',
      servicio_id: 'ajtrmzt2o',
      servicio_nombre: 'Corte Clásico',
      fecha: fechaHoy,
      hora: `1${i}:00`,
      precio: 250,
      estado: estados[i],
      creado_en: FieldValue.serverTimestamp()
    });
  }
  console.log('Citas de prueba creadas.');

  console.log('\n--- PROCESO COMPLETADO ---');
}

fixData().catch(console.error);
