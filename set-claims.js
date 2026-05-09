const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

async function setClaims() {
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

  const auth = getAuth(app);

  const users = [
    {
      email: 'admin@prueba.com',
      claims: {
        role: 'admin',
        barberia_id: 'barberia_prueba_01',
        nombre: 'Administrador de Prueba',
        activo: true
      }
    },
    {
      email: 'barbero@prueba.com',
      claims: {
        role: 'barbero',
        barberia_id: 'barberia_prueba_01',
        barbero_id: 'barbero_prueba_01',
        nombre: 'Barbero de Prueba',
        activo: true
      }
    }
  ];

  console.log('--- Configurando Custom Claims ---');
  for (const u of users) {
    try {
      const user = await auth.getUserByEmail(u.email);
      await auth.setCustomUserClaims(user.uid, u.claims);
      console.log(`Claims establecidos para ${u.email} (UID: ${user.uid})`);
    } catch (error) {
      console.error(`Error con ${u.email}:`, error.message);
    }
  }
  console.log('--- PROCESO COMPLETADO ---');
}

setClaims().catch(console.error);
