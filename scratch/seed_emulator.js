/**
 * Seed script para Firebase Emulator
 * Uso: node seed-emulator.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 4400;
const PROJECT_ID = 'barberapp-ant';

async function seedEmulator() {
  console.log('🔧 Configurando Firebase Emulator...');

  // Importar datos de seed
  const seedData = {
    barberias: [
      {
        id: 'barberia-test-1',
        nombre: 'Barbería Test',
        direccion: 'Av. Test #123',
        telefono: '+5215512345678',
        slug: 'barberia-test',
        activo: true,
        servicios: ['corte', 'barba', 'afeitado'],
        horario: {
          lunes: { inicio: '09:00', fin: '20:00' },
          martes: { inicio: '09:00', fin: '20:00' },
          miercoles: { inicio: '09:00', fin: '20:00' },
          jueves: { inicio: '09:00', fin: '20:00' },
          viernes: { inicio: '09:00', fin: '20:00' },
          sabado: { inicio: '10:00', fin: '18:00' },
          domingo: null
        }
      }
    ],
    usuarios: [
      { uid: 'test-admin-uid', email: 'admin@prueba.com', role: 'admin', barberia_id: 'barberia-test-1' },
      { uid: 'test-barbero-uid', email: 'barbero@prueba.com', role: 'barbero', barberia_id: 'barberia-test-1' },
      { uid: 'test-cliente-uid', email: 'cliente@prueba.com', role: 'usuario' }
    ]
  };

  console.log('✅ Datos de seed cargados');
  console.log('📦 Barberías:', seedData.barberias.length);
  console.log('👥 Usuarios:', seedData.usuarios.length);
  console.log('\n⚠️ Nota: Ejecutar manualmente con firebase emulators:exec');
}

seedEmulator().catch(console.error);