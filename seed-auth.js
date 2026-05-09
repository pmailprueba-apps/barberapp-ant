/**
 * Script para verificar y corregir autenticación en BarberApp
 * Uso: node seed-auth.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('../service-account.json');

async function seedAuth() {
  console.log('🔥 Verificando configuración de Firebase Admin...');

  try {
    initializeApp({
      credential: cert(serviceAccount)
    });

    const auth = getAuth();

    // Verificar usuarios de prueba
    const testUsers = [
      { email: 'superadmin@prueba.com', role: 'superadmin' },
      { email: 'admin@prueba.com', role: 'admin' },
      { email: 'barbero@prueba.com', role: 'barbero' },
      { email: 'cliente@prueba.com', role: 'usuario' }
    ];

    console.log('\n📋 Usuarios de prueba:');
    for (const user of testUsers) {
      try {
        const record = await auth.getUserByEmail(user.email);
        console.log(`  ✅ ${user.email} - role: ${user.role}`);
      } catch (e) {
        console.log(`  ❌ ${user.email} - NO ENCONTRADO`);
      }
    }

    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

seedAuth();