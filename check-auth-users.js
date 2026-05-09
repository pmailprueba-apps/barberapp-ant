const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

async function checkAuthUsers() {
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
  const emails = ['admin@prueba.com', 'barbero@prueba.com'];

  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`Email: ${user.email} | UID: ${user.uid} | Claims:`, JSON.stringify(user.customClaims, null, 2));
    } catch (e) {
      console.log(`Email: ${email} | NOT FOUND: ${e.message}`);
    }
  }
}

checkAuthUsers().catch(console.error);
