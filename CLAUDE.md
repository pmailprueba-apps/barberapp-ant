@AGENTS.md

# BarberApp — Proyecto SaaS multi-tenant para barberías

## Stack
- **Next.js 16.2** + React 19 + Tailwind CSS v4 (CSS-first)
- **Firebase** (Firestore + Auth + Storage) — Cliente SDK en frontend, Admin SDK en API routes
- **TypeScript strict** — `npx tsc --noEmit` debe pasar sin errores
- **PWA** — `@ducanh2912/next-pwa`, manifest en `/public/manifest.json`
- **Deploy** — Vercel (frontend + API routes)

## Estructura de Rutas (Actualizada)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # Login / Registro
│   │   └── seleccionar-rol/page.tsx # Selección inicial de rol
│   ├── (dashboard)/                 # Rutas protegidas por rol
│   │   ├── admin/
│   │   │   ├── dashboard/           # Panel Principal Admin
│   │   │   ├── config/              # Configuración de Barbería
│   │   │   ├── barberos/            # Gestión de equipo
│   │   │   ├── servicios/           # Precios y servicios
│   │   │   └── qr/                  # Gestión de códigos QR
│   │   ├── barbero/
│   │   │   └── dashboard/           # Panel del Barbero
│   │   └── usuario/                 # Dashboard de clientes (personas)
│   ├── api/                         # API Routes (Admin SDK requerido)
│   │   └── auth/set-custom-claims/  # Asignación de roles y barberia_id
│   └── b/[slug]/page.tsx            # Landing pública de la barbería
├── lib/
│   ├── firebase.ts                  # Configuración Cliente
│   └── firebase-admin.ts            # Configuración Admin (CRÍTICO: Lógica de limpieza de llaves PEM)
└── services/                        # Capa de datos (Firestore CRUD)
```

## Guía de Configuración Crítica (Vercel)

### Firebase Admin Private Key
En Vercel, la variable `FIREBASE_PRIVATE_KEY` debe contener la llave completa que empieza con `-----BEGIN PRIVATE KEY-----`. 
**Nota**: El sistema en `lib/firebase-admin.ts` está diseñado para reconstruir y limpiar la llave automáticamente si el formato de pegado en Vercel tiene problemas con saltos de línea o caracteres escapados.

### Variables de Entorno Requeridas
```env
# Cliente
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Admin (Server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII..."
```

## Reglas de Desarrollo y Estándares

1.  **Auth Custom Claims**: Los roles (`superadmin`, `admin`, `barbero`, `usuario`) y el `barberia_id` se manejan mediante Custom Claims. No confiar solo en Firestore para seguridad de rutas.
2.  **Rutas Dashboard**: Siempre usar el sub-dashboard correspondiente (`/admin/dashboard`, `/barbero/dashboard`).
3.  **Lazy Load Admin**: Solo inicializar `firebase-admin` mediante `getAdminAuth()` dentro de API routes o funciones de servidor.
4.  **Estética Premium**: Seguir el sistema de diseño basado en variables CSS (`--gold`, `--dark`, `--card`, `--muted`) definido en `globals.css`.

## Comandos Útiles
- `npm run dev`: Iniciar servidor local
- `npm run build`: Validar compilación (Obligatorio antes de push)
- `npx tsc --noEmit`: Validar tipos TypeScript
- `git push origin main`: Dispara el deploy automático en Vercel

## Definición de Roles
- **Superadmin**: Dueño de la plataforma (acceso a todas las barberías).
- **Admin**: Dueño de la barbería (gestiona su equipo, servicios y horarios).
- **Barbero**: Empleado (gestiona sus citas y horario personal).
- **Usuario**: Cliente final (agenda citas y acumula puntos).