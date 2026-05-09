# Deploy — BarberApp a Vercel (DEPRECADO)

> ⚠️ **IMPORTANTE:** Este método de despliegue ha sido reemplazado por **Google Cloud Platform (GCP) + Docker**.
> Para el despliegue actual, consulta la guía: [DEPLOY_GCP.md](./DEPLOY_GCP.md)

## 1. Conectar GitHub a Vercel

1. Ir a [vercel.com](https://vercel.com) → Login con GitHub
2. Click **"Add New..."** → **"Project"**
3. Seleccionar repo `pmailprueba-apps/barberapp-ant`
4. Click **"Import"**

## 2. Configurar Variables de Entorno

En Vercel Dashboard → tu proyecto → **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barberapp-ant.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barberapp-ant
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barberapp-ant.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

FIREBASE_ADMIN_PROJECT_ID=barberapp-ant
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@barberapp-ant.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_ADMIN_STORAGE_BUCKET=barberapp-ant.appspot.com

WHATSAPP_PROVIDER=manychat
MANYCHAT_API_KEY=MC_your_key_here
MANYCHAT_VERIFY_TOKEN=barberapp_verify_token

NEXT_PUBLIC_APP_URL=https://barberapp-ant.vercel.app
```

**Importante:** `FIREBASE_ADMIN_PRIVATE_KEY` debe tener los `\n` literales como aparecen en Firebase Console.

## 3. Build Command y Output Directory

Vercel auto-detecta:
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (dejar vacío o poner `.next`)

## 4. Framework Preset

Seleccionar **Next.js** — Vercel detecta automáticamente.

## 5. Deploy

Click **"Deploy"** — Vercel compila y deploya.

- URL temporal: `https://barberapp-ant.vercel.app`
- URL definitiva: configurable en **Domains**

## 6. Verificar Deploy

```bash
curl -s https://barberapp-ant.vercel.app/api/barberias | head -20
```

Debe responder (sin auth):
```json
{"barberias": [...]}
```

## 7. Dominio Personalizado (opcional)

En **Settings** → **Domains**: agregar `barberapp.mx` o el dominio que prefieras.

## Solución de problemas

### Error 500 en API routes
→ Verificar que `FIREBASE_ADMIN_PRIVATE_KEY` tenga `\n` literales (no saltos de línea reales).

### Error de autenticación Firebase
→ Verificar `NEXT_PUBLIC_FIREBASE_*` variables están correctas en Vercel.

### Build falla
→ Correr `npm run build` localmente primero. Debe pasar antes de push.

## Actualizar deploy

Cada vez que hagas push a `main`, Vercel redeploya automáticamente.

---

**Repo:** https://github.com/pmailprueba-apps/barberapp-ant
**Deploy:** https://barberapp-ant.vercel.app