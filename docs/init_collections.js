const admin = require('firebase-admin');

// Initialize with default credentials (logged in via CLI)
admin.initializeApp({
  projectId: 'barberapp-ant-2026'
});

const db = admin.firestore();

async function init() {
  const collections = [
    'barberias',
    'usuarios',
    'citas',
    'metricas_mensuales',
    'log_plataforma'
  ];

  for (const col of collections) {
    await db.collection(col).doc('_config_').set({
      initialized: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      description: `Collection placeholder for ${col}`
    });
    console.log(`Initialized collection: ${col}`);
  }
}

init().catch(console.error);
