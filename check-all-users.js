const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');

async function checkAllAuthUsers() {
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
  
  console.log("Listing all Auth users...");
  const listUsersResult = await auth.listUsers(100);
  listUsersResult.users.forEach((userRecord) => {
    console.log(`Email: ${userRecord.email || 'N/A'} | UID: ${userRecord.uid} | Claims:`, JSON.stringify(userRecord.customClaims || {}, null, 2));
  });
}

checkAllAuthUsers().catch(console.error);
