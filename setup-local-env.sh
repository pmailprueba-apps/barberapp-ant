#!/bin/bash
# ============================================================
# BarberApp — Setup Firebase Emulator Environment
# Ejecutar: chmod +x setup-local-env.sh && ./setup-local-env.sh
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SA_FILE="$PROJECT_DIR/service-account.json"

echo "============================================"
echo " BarberApp — Setup Ambiente Local"
echo "============================================"
echo ""

# 1. Verificar que existe firebase.json (indica proyecto Firebase)
if [ ! -f "$PROJECT_DIR/firebase.json" ]; then
  echo "❌ No encontré firebase.json en el proyecto."
  echo "   Este script debe ejecutarse desde la carpeta barberapp/"
  exit 1
fi

# 2. Pedir URL del proyecto Firebase
echo "📋 Necesito el ID de tu proyecto Firebase."
echo "   Vete a: https://console.firebase.google.com/"
echo "   Selecciona tu proyecto → ⚙️ Configuración del proyecto → General"
echo "   Copia el 'ID del proyecto' (ejemplo: barberapp-demo)"
echo ""
read -p "📝 ID del proyecto Firebase: " FIREBASE_PROJECT_ID

if [ -z "$FIREBASE_PROJECT_ID" ]; then
  echo "❌ ID requerido. Intenta de nuevo."
  exit 1
fi

# 3. Descargar service account
echo ""
echo "⬇️  Descargando service account..."
echo "   Firebase Console → ⚙️ Configuración del proyecto"
echo "   → Cuentas de servicio → Generar nueva clave privada"
echo "   → Nombre: barberapp-local"
echo ""
echo "   📁 Guarda el archivo como: service-account.json"
echo "   📂 En la carpeta: $PROJECT_DIR/"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Ve a https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/settings/serviceaccounts"
echo "   2. Click 'Generar nueva clave privada'"
echo "   3. Descarga el JSON y renómbralo a 'service-account.json'"
echo "   4. Muévelo a: $PROJECT_DIR/service-account.json"
echo ""

# 4. Verificar que existe el archivo después del paso manual
if [ ! -f "$SA_FILE" ]; then
  echo "❌ No encontré service-account.json"
  echo "   Una vez que lo descargues, ejecute este script de nuevo."
  exit 1
fi

# 5. Crear .env.local.dev
cat > "$PROJECT_DIR/.env.local.dev" << EOF
# ============================
# LOCAL DEV — BarberApp
# ============================
NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:fake

FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL=dev@$FIREBASE_PROJECT_ID.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=placeholder-key

FIREBASE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
NEXT_PUBLIC_USE_EMULATOR=true
EOF

echo ""
echo "✅ Archivos configurados:"
echo "   📄 .env.local.dev — listo"
echo "   📄 service-account.json — presente"
echo ""
echo "============================================"
echo " Próximos pasos:"
echo "============================================"
echo ""
echo "1. Instalar dependencias de emuladores:"
echo "   cd $PROJECT_DIR"
echo "   npm install -g firebase-tools"
echo ""
echo "2. Crear un proyecto Firebase DEMO para local:"
echo "   Ve a https://console.firebase.google.com/"
echo "   → Añadir proyecto → 'barberapp-local-demo'"
echo "   → Habilitar Firestore + Auth (Email/Pass)"
echo "   → Copiar las variables del proyecto demo"
echo ""
echo "3. Levantar emuladores:"
echo "   firebase emulators:start --project=$FIREBASE_PROJECT_ID"
echo ""
echo "4. En otra terminal, Next.js dev:"
echo "   NEXT_PUBLIC_ENV=local npm run dev"
echo ""
echo "============================================"
