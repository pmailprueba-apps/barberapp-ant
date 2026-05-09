# INSTRUCTIVO COMPLETO DE IMPLEMENTACIÓN: Lashes & Nails App
## Guía Definitiva para Agente de Implementación - Con Todos los Archivos, Configuraciones y Lecciones Aprendidas

---

## ⚠️ NOTA IMPORTANTE: MIGRACIÓN PENDIENTE DE AUTORIZACIÓN

**ESTE DOCUMENTO DESCRIBE EL PLAN DE IMPLEMENTACIÓN COMPLETO.**

**NINGUNA FASE DE MIGRACIÓN SE REALIZARÁ HASTA QUE EL USUARIO LO AUTORICE EXPLICITAMENTE.**

Cada una de las siguientes fases requiere autorización del usuario antes de proceder:
- FASE 1 a FASE 10: Todas requieren autorización explícita

Cada fase se ejecutará SOLO después de recibir confirmación explícita del usuario.

---

## ⚠️ MODELO DE NEGOCIOS: 3 VERSIONES IDENTICAS CON CONFIGURACIONES DISTINTAS

**Lashes & Nails** será una **COPIA EXACTA de BarberApp** en cuanto a arquitectura, código y funcionalidad, pero con:

1. **Branding diferente** (nombre, colores, iconos, logo)
2. **Servicios diferentes** (uñas, pestañas, estética en vez de barbería)
3. **Categorías diferentes** (multi-categoría en vez de servicios únicos)
4. **3 Environments separados** en Vercel + Firebase propio cada uno:
   - **DEV/TESTING** → Para pruebas internas
   - **PRODUCTION** → Para uso real con clientes
   - **SALES/VENTA** → Para demostración a prospectos (modo demo con trial)

**NO se modifica el código base de BarberApp. Se clona y se personaliza.**

---

## 0. LECCIONES APRENDIDAS DE BARBERAPP (CRÍTICO LEER)

### Errores cometíods en BarberApp que DEBES evitar:

#### 0.1 Errores de Firebase

| Error en BarberApp | Cómo evitarlo en LashesApp |
|--------------------|---------------------------|
| Llaves PEM con saltos de línea corruptos en Vercel | Usar `\n` literal en vez de saltos de línea reales, o implementar lógica de limpieza automática (ya existe en BarberApp, copiarla) |
| Custom Claims no se actualizaban immediately | Forzar logout/login o usar `getAdminAuth().revokeRefreshTokens()` después de cambiar claims |
| Firestore rules mal configuradas al inicio | Definir reglas ANTES de escribir código, no después |
| Índices compuestos no creados | Crear índices ANTES de que fallen las queries (ver sección Firestore) |
| Storage rules muy permisivas | Configurar desde el inicio: solo el admin de cada salón puede subir a su carpeta |

#### 0.2 Errores de GitHub/Vercel

| Error en BarberApp | Cómo evitarlo en LashesApp |
|--------------------|---------------------------|
| Secrets de Vercel mal nombrados | Usar prefijo consistente: `FIREBASE_` para todas las vars de Firebase |
| Deploy sin validar `npm run build` primero | SIEMPRE ejecutar build local antes de push |
| Rama main con código roto | NO hacer push directo a main; usar PRs |
| Variables de entorno en repo | NUNCA commitear `.env`, usar solo Vercel Dashboard |

#### 0.3 Errores de TypeScript

| Error en BarberApp | Cómo evitarlo en LashesApp |
|--------------------|---------------------------|
| Tipos `any` dispersos | TypeScript strict desde el día 1 |
| Interfaces no exportadas | Todas las interfaces en `/src/types/` y exportadas |
| Tipos de Firestore desincronizados | Crear tiposmirror de la estructura de Firestore ANTES de usarlos |

#### 0.4 Errores de Arquitectura

| Error en BarberApp | Cómo evitarlo en LashesApp |
|--------------------|---------------------------|
| Rutas de dashboard incorrectas (admin/dashboard vs admin/) | Documentar estructura de rutas en CLAUDE.md |
| Hook de auth en lugares equivocados | Centralizar auth en Context, usar siempre el hook useAuth() |
| Admin SDK importado en frontend | Firebase Admin SOLO en `/api` routes, NUNCA en componentes |

---

## 1. HERRAMIENTAS Y APLICACIONES NECESARIAS

### 1.1 Cuentas Requeridas

```
□ GitHub (cuenta existente o crear nueva)
□ Vercel (cuenta existente o crear nueva)
□ Firebase (proyecto existente o crear nuevo proyecto)
□ Google Cloud (generalmente la misma que Firebase)
□ Node.js 20+ instalado
□ npm o yarn
□ Git instalado
```

### 1.2 Aplicaciones Recomendadas

```
□ GitHub Desktop (para gestionar repos) - https://desktop.github.com/
□ TablePlus o Firebase Console (ver Firestore)
□ Postman (testear API routes)
□ Figma (para mockups de UI)
□ Notion o Obsidian (para documentación adicional)
□ Slack o Discord (para notificaciones de deploy)
```

### 1.3 Extensiones de VS Code Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "figma.figma-vscode-extension",
    "christian-kohler.path-intellisense",
    "dsznajder.es7-react-js-snippets",
    "bradgarropy.bradgarropy"
  ]
}
```

---

## 2. ESTRUCTURA COMPLETA DE ARCHIVOS A CREAR/MODIFICAR

### 2.1 Estructura de Proyecto

```
lashes-app/                      # NUEVO PROYECTO (clonado de barberapp)
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD para Vercel (NUEVO)
├── public/
│   ├── manifest.json           # MODIFICAR: nombre, iconos, theme_color
│   ├── icons/                  # NUEVO: iconos de belleza (uñas, pestañas)
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── apple-touch-icon.png
│   │   └── favicon.ico
│   └── og-image.png           # NUEVO: imagen para redes sociales
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx        # MODIFICAR: branding beauty
│   │   │   └── seleccionar-rol/page.tsx  # MODIFICAR: labels beauty
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/page.tsx   # MODIFICAR: métricas beauty
│   │   │   │   ├── config/page.tsx      # MODIFICAR: campos beauty
│   │   │   │   ├── especialistas/       # NUEVO (era barberos)
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── servicios/           # MODIFICAR: categorías
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── productos/          # NUEVO
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── clientes/           # NUEVO (era usuarios)
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── puntos/             # MODIFICAR: canjes beauty
│   │   │   │   │   └── page.tsx
│   │   │   │   └── qr/page.tsx         # MODIFICAR: QR beauty
│   │   │   ├── especialista/           # NUEVO (era barbero)
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx
│   │   │   └── cliente/               # MODIFICAR (era usuario)
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       ├── mis-citas/
│   │   │       │   └── page.tsx
│   │   │       ├── mis-puntos/
│   │   │       │   └── page.tsx
│   │   │       └── mi-qr/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── set-custom-claims/  # COPIAR de BarberApp
│   │   │   │   └── me/route.ts         # COPIAR de BarberApp
│   │   │   ├── salon/                  # MODIFICAR (era barberias)
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── [id]/config/route.ts
│   │   │   ├── servicios/             # MODIFICAR
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── especialistas/          # NUEVO (era barberos)
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── [id]/citas/route.ts
│   │   │   ├── clientes/               # NUEVO
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── citas/
│   │   │   │   ├── route.ts           # MODIFICAR
│   │   │   │   ├── [id]/route.ts      # MODIFICAR
│   │   │   │   └── [id]/completar/route.ts
│   │   │   ├── productos/             # NUEVO
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── puntos/
│   │   │   │   ├── route.ts           # MODIFICAR
│   │   │   │   ├── canjear/route.ts   # MODIFICAR
│   │   │   │   └── historial/route.ts # MODIFICAR
│   │   │   ├── webhooks/
│   │   │   │   ├── whatsapp/route.ts  # MODIFICAR templates
│   │   │   │   └── n8n/route.ts      # MODIFICAR
│   │   │   ├── upload/route.ts        # MODIFICAR
│   │   │   └── log/route.ts           # COPIAR
│   │   └── b/[slug]/
│   │       └── page.tsx              # MODIFICAR: belleza
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx            # COPIAR
│   │   │   ├── RoleGate.tsx          # COPIAR
│   │   │   ├── ServiceCard.tsx       # MODIFICAR: categorías
│   │   │   ├── PuntosBadge.tsx       # MODIFICAR
│   │   │   ├── CitaCard.tsx          # MODIFICAR
│   │   │   ├── EspecialistaCard.tsx   # NUEVO
│   │   │   ├── ProductoCard.tsx      # NUEVO
│   │   │   ├── BookingFlow.tsx       # MODIFICAR
│   │   │   ├── StatsCards.tsx        # MODIFICAR
│   │   │   └── ...
│   │   └── layouts/
│   │       ├── Sidebar.tsx           # MODIFICAR: labels beauty
│   │       ├── Header.tsx            # MODIFICAR: branding
│   │       └── MobileNav.tsx          # MODIFICAR
│   ├── hooks/
│   │   └── useAuth.tsx               # COPIAR (no cambiar)
│   ├── lib/
│   │   ├── firebase.ts               # COPIAR (cambiar nombre app)
│   │   ├── firebase-admin.ts         # COPIAR (cambiar nombre app)
│   │   ├── auth.ts                   # COPIAR
│   │   ├── citas.ts                  # MODIFICAR: tipos beauty
│   │   │                             # NO CAMBIAR lógica anti-doblebooking
│   │   ├── puntos.ts                 # MODIFICAR: puntos beauty
│   │   ├── slots.ts                  # MODIFICAR: duraciones beauty
│   │   ├── servicios.ts              # MODIFICAR: seed data beauty
│   │   ├── whatsapp.ts               # MODIFICAR: templates beauty
│   │   ├── productos.ts              # NUEVO
│   │   ├── utils.ts                   # COPIAR
│   │   ├── colors.ts                  # NUEVO: paleta rosa/berry
│   │   └── constants.ts               # MODIFICAR
│   ├── services/
│   │   ├── salonService.ts           # MODIFICAR (era barberiaService)
│   │   ├── especialistaService.ts    # MODIFICAR (era barberoService)
│   │   ├── clienteService.ts        # NUEVO
│   │   ├── servicioService.ts       # MODIFICAR
│   │   ├── citaService.ts           # COPIAR
│   │   ├── puntosService.ts         # MODIFICAR
│   │   ├── productoService.ts       # NUEVO
│   │   └── superAdminService.ts      # COPIAR
│   └── types/
│       ├── index.ts                  # COPIAR y agregar tipos beauty
│       ├── roles.ts                  # MODIFICAR: display names
│       ├── salon.ts                  # NUEVO (era barberia.ts)
│       ├── servicio.ts               # NUEVO
│       ├── cita.ts                   # MODIFICAR: tipos beauty
│       ├── especialista.ts           # NUEVO (era barbero.ts)
│       ├── cliente.ts                # NUEVO
│       ├── producto.ts               # NUEVO
│       ├── puntos.ts                 # MODIFICAR
│       └── firebase.ts               # COPIAR
├── functions/                        # NUEVO (Cloud Functions si se usan)
│   ├── src/
│   │   ├── index.ts
│   │   ├── envios.ts                # Recordatorios de citas
│   │   └── pagos.ts                 # Verificación de suscripciones
│   └── package.json
├── firestore.rules                   # MODIFICAR: reglas de belleza
├── firestore.indexes.json            # CREAR: índices necesarios
├── .env.example                     # NUEVO: template de vars
├── .env.local                       # NO COMMITEAR
├── .gitignore                       # MODIFICAR: agregar .env
├── package.json                     # MODIFICAR: nombre, descripción
├── tsconfig.json                    # COPIAR (TypeScript strict)
├── next.config.ts                   # MODIFICAR
├── tailwind.config.ts               # MODIFICAR: colores beauty
├── postcss.config.js                 # COPIAR
├── eslint.config.js                  # COPIAR
├── vercel.json                      # COPIAR
└── docs/
    ├── README.md                    # MODIFICAR
    ├── INSTRUCCIONES.md             # MODIFICAR
    ├── CLAUDE.md                     # MODIFICAR con estructura beauty
    ├── ESTRUCTURA_SERVICIOS.md       # NUEVO
    ├── GUIA_ESPECIALISTAS.md         # NUEVO
    ├── GUIA_CLIENTES.md              # NUEVO
    ├── CONFIG_FIREBASE.md            # NUEVO (este doc)
    ├── CONFIG_GITHUB_VERCEL.md       # NUEVO
    └── CHECKLIST_IMPLEMENTACION.md   # NUEVO
```

### 2.2 Archivos CRUDOS vs COPIADOS vs MODIFICADOS

| Archivo | Acción | Notas |
|---------|--------|-------|
| `src/lib/firebase.ts` | **COPIAR** | Cambiar nombre app a "Lashes & Nails" |
| `src/lib/firebase-admin.ts` | **COPIAR** | Misma lógica de limpieza PEM |
| `src/hooks/useAuth.tsx` | **COPIAR** | No necesita cambios |
| `src/app/api/**` | **COPIAR y MODIFICAR** | Cambiar `barberia_id` → `salon_id` |
| `firestore.rules` | **MODIFICAR** | Cambiar `barberias` → `salones` |
| `tailwind.config.ts` | **MODIFICAR** | Colores rosa/berry |
| `public/manifest.json` | **MODIFICAR** | Nombre, iconos, theme |

---

## 3. CONFIGURACIÓN DE CUENTAS

### 3.1 Firebase Console - Paso a Paso

#### 3.1.1 Crear Proyecto

```
1. Ir a https://console.firebase.google.com/
2. Click "Crear proyecto"
3. Nombre: "lashes-app" (o el nombre que prefieras)
4. Google Analytics: HABILITAR (recomendado)
5. click "Crear proyecto"
6. Esperar a que termine
```

#### 3.1.2 Registrar App Web

```
1. En el dashboard del proyecto, click </> (Web)
2. Apodo: "Lashes & Nails Web App"
3. NO marcar "Firebase Hosting" (usamos Vercel)
4. Click "Registrar app"
5. COPIAR las variables que muestra (las necesitaremos después)
```

#### 3.1.3 Habilitar Authentication

```
1. sidebar → Authentication → click "Comenzar"
2. En "Proveedores" habilitar:
   □ Email/CONTRASEÑA
   □ Google
3. Para Google:
   - Click en Google → "Habilitar"
   - Correo de soporte: seleccionar tu correo
   - Click "Guardar"
4. En "Configuración" → "Templates de correo electrónico"
   - Personalizar el email de verificación
   - Personalizar el email de recuperación de contraseña
5. Agregar dominios autorizados:
   - localhost (para desarrollo)
   - tu-dominio.vercel.app (cuando hagas deploy)
   - cualquier otro dominio personalizado
```

#### 3.1.4 Crear Firestore Database

```
1. Firestore Database → click "Crear base de datos"
2. Modo: "Comenzar en modo de prueba"
   - NOTA: Esto es SOLO para desarrollo. Después cambiar a modo producción con reglas.
3. Ubicación: seleccionar la más cercana a tus usuarios
4. Click "Habilitar"
5. Ir a "Índices" → "Agregar índice"
   - Crear índices compuestos (ver sección 3.1.8)
```

#### 3.1.5 Crear Storage

```
1. Storage → click "Comenzar"
2. Modo: "Comenzar en modo de prueba"
3. Ubicación: misma que Firestore
4. Click "Habilitar"
5. IMPORTANTE: Ir a "Reglas" y configurar (ver sección Firestore rules)
```

#### 3.1.6 Configurar Cloud Messaging (FCM)

```
1. sidebar → Configuración del proyecto → "Cloud Messaging"
2. "Certificados web" → "Web Push certificates"
3. Click "Generar par de claves"
4. COPIAR las claves (necesitaremos `VAPID_KEY`)
5. Guardar
```

#### 3.1.7 Obtener Admin SDK Keys

```
1. sidebar → Configuración del proyecto → "Cuentas de servicio"
2. "SDK Admin de Firebase" → click "Generar nueva clave privada"
3. Se descargará un archivo .json
4. GUARDARLO EN UN LUGAR SEGURO (es la llave de admin)
5. ABRIRLO y copiar los valores para las variables de entorno:
   - project_id
   - client_email
   - private_key (con saltos de línea como \n)
```

#### 3.1.8 Crear Índices Compuestos de Firestore

```
Ir a Firestore → "Índices" → "Índices compuestos" → "Agregar índice"

Crear los siguientes índices:

COLECCIÓN              | CAMPOS                            | ESTADO
-----------------------|-----------------------------------|--------
citas                  | salonId ASC, fecha ASC, hora ASC  | Habilitado
citas                  | clienteId ASC, fecha ASC         | Habilitado
citas                  | especialistaId ASC, fecha ASC    | Habilitado
servicios              | salonId ASC, categoria ASC       | Habilitado
puntos                 | clienteId ASC, fecha ASC         | Habilitado
productos              | salonId ASC, categoria ASC       | Habilitado
```

#### 3.1.9 Estructura de Colecciones Firestore

```
salones/
  {salonId}/
    - nombre: string
    - slug: string
    - logo: string (URL)
    - direccion: string
    - telefono: string
    - whatsapp: string
    - instagram: string
    - tiktok: string
    - facebook: string
    - horarios: array
    - categoriasHabilitadas: array
    - servicios: subcoleccion
    - activo: boolean
    - fechaCreacion: timestamp
    - ownerId: string (uid del admin)

  servicios/
    {servicioId}/
      - nombre: string
      - categoria: string
      - precio: number
      - duracionMinutos: number
      - descripcion: string
      - activo: boolean

  especialistas/
    {especialistaId}/
      - nombre: string
      - email: string
      - telefono: string
      - foto: string
      - categorias: array (en qué categorías trabaja)
      - activo: boolean

  clientes/
    {clienteId}/
      - nombre: string
      - email: string
      - telefono: string
      - puntos: number
      - fechaRegistro: timestamp
      - cumpleanos: string

  citas/
    {citaId}/
      - salonId: string
      - clienteId: string
      - especialistaId: string
      - servicioId: string
      - fecha: string
      - hora: string
      - duracionMinutos: number
      - precio: number
      - estado: 'pendiente' | 'completada' | 'cancelada'
      - calificacion: number
      - comentario: string
      - puntosGanados: number
      - fechaCreacion: timestamp

  puntos/
    {puntoId}/
      - clienteId: string
      - salonId: string
      - tipo: 'ganado' | 'canjeado'
      - cantidad: number
      - descripcion: string
      - citaId: string (opcional)
      - fecha: timestamp

  productos/
    {productoId}/
      - salonId: string
      - nombre: string
      - descripcion: string
      - categoria: string
      - precio: number
      - stock: number
      - imagen: string
      - activo: boolean

usuarios/
  {uid}/
    - email: string
    - nombre: string
    - telefono: string
    - rol: 'superadmin' | 'admin' | 'especialista' | 'cliente'
    - salonId: string (si es admin o especialista)
    - creadoEn: timestamp
```

### 3.2 GitHub - Paso a Paso

#### 3.2.1 Crear Repositorio

```
1. Ir a https://github.com/new
2. Repository name: "lashes-app"
3. Description: "Plataforma SaaS multi-tenant para salones de belleza"
4. Público o Privado: Privado (recomendado)
5. NO marcar "Add a README file" (ya tenemos código)
6. NO seleccionar .gitignore (lo traeremos de BarberApp)
7. Click "Create repository"
```

#### 3.2.2 Subir el Código Inicial

```bash
# En la carpeta del proyecto clonado
cd lashes-app

# Agregar remoto
git remote add origin https://github.com/TU_USUARIO/lashes-app.git

# Verificar
git remote -v

# Hacer push inicial (primera vez puede pedir credenciales)
git push -u origin main
```

#### 3.2.3 Proteger Rama Main

```
1. En GitHub → Settings → Branches
2. "Branch protection rules" → "Add rule"
3. Branch name pattern: "main"
4. Marcar:
   □ Require pull request reviews before merging
   □ Require status checks to pass before merging
   □ Require branches to be up to date before merging
5. Click "Create"
```

### 3.3 Vercel - Paso a Paso (CRÍTICO - 3 ENVIRONMENTS)

### 3.3.1 Arquitectura de Environments

**IMPORTANTE:** Se crearán 3 proyectos en Vercel separados para diferentes propósitos:

```
┌─────────────────────────────────────────────────────────────────┐
│                     LASHES & NAILS PLATFORM                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   DEV/TESTING   │   PRODUCTION    │        SALES/VENTA          │
│  (Pruebas)      │   (Real)        │    (Para vender a clients)  │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ lashes-dev      │ lashes-app      │ lashes-saas                 │
│ .vercel.app     │ .vercel.app     │ .vercel.app                 │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Firebase Test   │ Firebase Prod   │ Firebase Sales              │
│ Mismo proyecto  │ Proyecto propio │ Proyecto propio             │
│ o proyecto      │ con datos       │ para cada cliente           │
│ separado        │ reales          │ (multi-tenant)              │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ URL: testing    │ URL: app        │ URL: (dominio del cliente   │
│                 │                 │ o subdominio)               │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 3.3.2 Crear Proyecto TESTING (lashes-dev)

```
1. Ir a https://vercel.com/new
2. "Import Git Repository" → seleccionar "lashes-app"
3. Project Name: "lashes-dev"
4. Framework: Next.js
5. Root Directory: .
6. Build Command: npm run build
7. Environment Variables → AGREGAR TODAS las variables (ver sección 4)
   - Marcar " preview" y "development" (NO production)
8. Click "Deploy"

CONFIGURACIÓN ESPECÍFICA TESTING:
- Environment: Preview + Development
- Branch: main (para testing automático en PRs)
```

### 3.3.3 Crear Proyecto PRODUCTION (lashes-app)

```
1. Ir a https://vercel.com/new
2. "Import Git Repository" → seleccionar "lashes-app"
3. Project Name: "lashes-app"
4. Framework: Next.js
5. Root Directory: .
6. Build Command: npm run build
7. Environment Variables → AGREGAR TODAS las variables (ver sección 4)
   - Marcar "Production" SOLAMENTE
   - NO marcar Preview ni Development
8. Click "Deploy"

CONFIGURACIÓN ESPECÍFICA PRODUCTION:
- Environment: Production
- Branch: main (protección habilitada)
- Auto-redeploy: solo en push a main (no en preview)
```

### 3.3.4 Crear Proyecto SALES/VENTA (lashes-saas)

```
1. Ir a https://vercel.com/new
2. "Import Git Repository" → seleccionar "lashes-app"
3. Project Name: "lashes-saas"
4. Framework: Next.js
5. Root Directory: .
6. Build Command: npm run build
7. Environment Variables → AGREGAR TODAS las variables (ver sección 4)
   - Marcar "Production" SOLAMENTE
   - Incluir modo demo/sandbox
8. Click "Deploy"

CONFIGURACIÓN ESPECÍFICA SALES:
- Environment: Production
- Branch: main
- Esta versión incluye:
  - Modo demo activo (datos de ejemplo precargados)
  - Branding genérico "Lashes & Nails Platform"
  - trial de 14 días
  - Contacto sales@tu-dominio.com
```

### 3.3.5 Configurar Environment Variables por Environment

**EN VERCEL DASHBOARD → PROJECT SETTINGS → ENVIRONMENT VARIABLES**

Para CADA proyecto (dev, prod, sales), configurar:

```bash
# ============== VARIABLES COMUNES ==============

# Firebase (diferentes proyectos según environment)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx

NEXT_PUBLIC_VAPID_KEY=xxx

# ============== VARIABLES ESPECIFICAS ==============

# APP
NEXT_PUBLIC_APP_NAME="Lashes & Nails"
NEXT_PUBLIC_APP_URL=https://lashes-dev.vercel.app  # CAMBIAR según env

# ENVIRONMENT MODE
NEXT_PUBLIC_ENVIRONMENT=development  # development | production | sales

# SALES SPECIFIC
NEXT_PUBLIC_DEMO_MODE=true          # Solo en sales
NEXT_PUBLIC_TRIAL_DAYS=14            # Solo en sales
NEXT_PUBLIC_SALES_EMAIL=sales@example.com
```

### 3.3.6 Configurar Dominios Personalizados

```
PARA CADA PROYECTO EN VERCEL → Settings → Domains:

DEV/TESTING:
  └─ lashes-dev.tu-dominio.com (opcional)

PRODUCTION:
  └─ app.lashes-nails.com (ejemplo)

SALES:
  └─ try.lashes-nails.com ( Landing para prospectos)
  └─ docs.lashes-nails.com (Documentación)
```

### 3.3.7 Configurar GitHub Actions para Auto-Deploy

**CREAR ARCHIVO: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}

      - name: Run TypeScript check
        run: npx tsc --noEmit

      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_DEV }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy to Vercel (Production)
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PROD }}
          vercel-args: '--prod'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### 3.3.8 Secrets en GitHub (para el workflow)

```
GitHub → Settings → Secrets and variables → Actions → New repository secret

AGREGAR:
- VERCEL_TOKEN (de Vercel Account Settings)
- VERCEL_ORG_ID (de Vercel Team Settings)
- VERCEL_PROJECT_ID_DEV (del proyecto dev)
- VERCEL_PROJECT_ID_PROD (del proyecto prod)
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
```

### 3.3.9 GitHub - Proteger Ramas

```
1. GitHub → Settings → Branches → Add rule
2. Branch name pattern: main
3. Marcar:
   ☑ Require pull request reviews before merging (1 review mínimo)
   ☑ Require status checks to pass before merging
   ☑ Require branches to be up to date before merging
   ☑ Include administrators
4. Click "Create"
```

---

## 4. VARIABLES DE ENTORNO COMPLETAS

### 4.1 Archivo .env.example (TEMPLATE)

Crear archivo `/lashes-app/.env.example` con:

```bash
# ===========================================
# FIREBASE CLIENT (Frontend - público)
# ===========================================
NEXT_PUBLIC_FIREBASE_API_KEY=AquiTuApiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ===========================================
# FIREBASE ADMIN (Backend - secreto)
# ===========================================
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@tu-proyecto.iam.gserviceaccount.com
# IMPORTANTE: El salto de línea debe ser \n literal, no presionar Enter
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# ===========================================
# FIREBASE CLOUD MESSAGING
# ===========================================
NEXT_PUBLIC_VAPID_KEY=tu-vapid-public-key

# ===========================================
# APP CONFIG
# ===========================================
NEXT_PUBLIC_APP_NAME="Lashes & Nails"
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ===========================================
# WhatsApp (Meta Business)
# ===========================================
WHATSAPP_PHONE_NUMBER_ID=tu-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=tu-business-account-id
WHATSAPP_ACCESS_TOKEN=tu-access-token
WHATSAPP_WEBHOOK_SECRET=tu-webhook-secret

# ===========================================
# n8n Webhook (Automatizaciones)
# ===========================================
N8N_WEBHOOK_URL=https://tu-n8n.app/webhook/
N8N_API_KEY=tu-n8n-api-key

# ===========================================
# Opcional: Analytics
# ===========================================
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 4.2 Cómo Obtener Cada Variable

#### Firebase Client (de sección 3.1.2)
Las 6 variables `NEXT_PUBLIC_FIREBASE_*` vienen del archivo de configuración web que Firebase te da al registrar la app.

#### Firebase Admin (de sección 3.1.7)
Del archivo JSON que se descarga al generar la clave privada:
- `FIREBASE_PROJECT_ID` = project_id
- `FIREBASE_CLIENT_EMAIL` = client_email
- `FIREBASE_PRIVATE_KEY` = private_key (con \n替换真正的 saltos de línea)

#### VAPID Key (de sección 3.1.6)
De Cloud Messaging → Certificados web → Par de claves

#### WhatsApp (Meta for Developers)
```
1. Ir a https://developers.facebook.com/
2. Crear app tipo "Business"
3. Agregar producto "WhatsApp"
4. Configurar phone number
5. En API Setup obtener:
   - Phone Number ID
   - Business Account ID
6. En "Configuration" → WhatsApp Business Account → Access Tokens
   - Generar token de acceso temporal
   - Para持久 token necesitas Meta Business Account verificado
```

#### n8n
```
1. Instalar n8n (self-hosted o cloud)
2. Crear primer workflow
3. Copiar URL del webhook
4. Opcional: crear API key
```

---

## 5. FIRESTORE RULES (SEGURIDAD)

### 5.1 firestore.rules - Completo

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Función auxiliar: verificar que el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Función auxiliar: obtener el rol del usuario
    function getUserRole() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol;
    }

    // Función auxiliar: verificar que es admin del salón
    function isAdminOf(salonId) {
      return isAuthenticated() &&
        (getUserRole() == 'superadmin' ||
         (getUserRole() == 'admin' &&
          get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.salonId == salonId));
    }

    // Función auxiliar: verificar que es especialista del salón
    function isEspecialistaOf(salonId) {
      return isAuthenticated() &&
        (getUserRole() == 'especialista' &&
         get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.salonId == salonId);
    }

    // ===========================================
    // COLECCIÓN: salones
    // ===========================================
    match /salones/{salonId} {
      // Cualquiera puede leer (para landing pages públicas)
      allow read: if true;

      // Solo superadmin puede crear salones
      allow create: if isAuthenticated() && getUserRole() == 'superadmin';

      // Solo admin del salón o superadmin puede actualizar
      allow update: if isAdminOf(salonId) || getUserRole() == 'superadmin';

      // Solo superadmin puede eliminar
      allow delete: if getUserRole() == 'superadmin';

      // Subcolección: servicios
      match /servicios/{servicioId} {
        allow read: if true;
        allow write: if isAdminOf(salonId);

        // Subcolección: sub-servicios si hay
        match /opciones/{opcionId} {
          allow read: if true;
          allow write: if isAdminOf(salonId);
        }
      }

      // Subcolección: especialistas
      match /especialistas/{especialistaId} {
        allow read: if true;
        allow create: if isAdminOf(salonId);
        allow update: if isAdminOf(salonId);
        allow delete: if isAdminOf(salonId);
      }

      // Subcolección: clientes
      match /clientes/{clienteId} {
        allow read: if isAuthenticated();
        allow write: if isAdminOf(salonId) || isEspecialistaOf(salonId);

        // Subcolección: puntos
        match /puntos/{puntoId} {
          allow read: if isAuthenticated();
          allow create: if isAdminOf(salonId) || isEspecialistaOf(salonId);
          allow update, delete: if isAdminOf(salonId);
        }
      }

      // Subcolección: citas
      match /citas/{citaId} {
        allow read: if isAuthenticated() &&
          (resource.data.salonId == salonId ||
           resource.data.clienteId == request.auth.uid ||
           resource.data.especialistaId == request.auth.uid);

        allow create: if isAdminOf(salonId) ||
          (isAuthenticated() && request.resource.data.salonId == salonId);

        allow update: if isAdminOf(salonId) ||
          (isEspecialistaOf(salonId) && resource.data.especialistaId == request.auth.uid);

        allow delete: if isAdminOf(salonId);
      }

      // Subcolección: productos
      match /productos/{productoId} {
        allow read: if true;
        allow write: if isAdminOf(salonId);
      }
    }

    // ===========================================
    // COLECCIÓN: usuarios (custom claims data)
    // ===========================================
    match /usuarios/{userId} {
      // Usuarios pueden leer su propio documento
      allow read: if isAuthenticated() && request.auth.uid == userId;

      // Solo admins pueden crear/actualizar
      allow create, update: if isAuthenticated() &&
        (getUserRole() == 'superadmin' || getUserRole() == 'admin');

      // Nadie puede eliminar (excepto desde backend)
      allow delete: if false;
    }

    // ===========================================
    // COLECCIÓN: logs (solo superadmin)
    // ===========================================
    match /logs/{logId} {
      allow read: if isAuthenticated() && getUserRole() == 'superadmin';
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }
  }
}
```

### 5.2 storage.rules - Completo

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/objects {

    // Función auxiliar
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol in ['superadmin', 'admin'];
    }

    // Logos de salón: solo el admin del salón puede subir
    match /salones/{salonId}/logo/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.salonId == salonId;
    }

    // Avatares de especialistas y clientes
    match /avatares/{userId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Productos
    match /productos/{salonId}/{fileName} {
      allow read: if true;
      allow write: if isAuthenticated() &&
        get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.salonId == salonId;
    }
  }
}
```

---

## 6. ESTRUCTURA DE RUTAS DE LA APP

### 6.1 Mapa Completo de Rutas

```
RUTAS PÚBLICAS
├── /                          # Redirect a /login o /b/[slug]
├── /login                     # Login / Registro
├── /seleccionar-rol           # Selector de rol (post-login)
├── /b/[slug]                  # Landing pública del salón

RUTAS ADMIN (rol: admin)
├── /admin/dashboard          # Dashboard principal
├── /admin/config             # Configuración del salón
├── /admin/especialistas      # Gestión de especialistas
├── /admin/servicios          # Gestión de servicios
├── /admin/clientes           # Gestión de clientes
├── /admin/citas              # Todas las citas
├── /admin/productos          # Gestión de productos
├── /admin/puntos             # Programa de puntos
├── /admin/qr                 # Códigos QR

RUTAS ESPECIALISTA (rol: especialista)
├── /especialista/dashboard   # Mis citas de hoy
├── /especialista/agenda       # Mi agenda
├── /especialista/clientes     # Mis clientes

RUTAS CLIENTE (rol: cliente)
├── /cliente/dashboard         # Mi dashboard
├── /cliente/mis-citas         # Mis citas
├── /cliente/mis-puntos        # Mis puntos
├── /cliente/mi-qr            # Mi código QR

RUTAS SUPERADMIN (rol: superadmin)
├── /superadmin/dashboard     # Dashboard global
├── /superadmin/salones        # Todos los salones
├── /superadmin/usuarios       # Todos los usuarios
├── /superadmin/logs          # Logs del sistema
├── /superadmin/pagos         # Pagos y suscripciones
```

### 6.2 Middleware de Protección

El middleware debe redirigir según rol:

```typescript
// middleware.ts (pseudocódigo)
// Basado en las custom claims y el rol del usuario

const rolRedirects = {
  'admin': '/admin/dashboard',
  'especialista': '/especialista/dashboard',
  'cliente': '/cliente/dashboard',
  'superadmin': '/superadmin/dashboard',
}
```

---

## 7. CHECKLIST DE IMPLEMENTACIÓN COMPLETO

### Fase 0: Preparación (antes de cualquier código)

- [ ] Crear cuenta GitHub
- [ ] Crear cuenta Vercel
- [ ] Crear proyecto en Firebase Console
- [ ] Registrar app web en Firebase
- [ ] Habilitar Authentication (Email + Google)
- [ ] Crear Firestore Database
- [ ] Habilitar Storage
- [ ] Configurar Cloud Messaging
- [ ] Generar claves Admin SDK
- [ ] Crear índices compuestos en Firestore
- [ ] Obtener variables de entorno
- [ ] Subir código a GitHub
- [ ] Conectar GitHub a Vercel
- [ ] Configurar secrets en Vercel
- [ ] Primer deploy de prueba
- [ ] Verificar que `npm run build` pasa localmente

### Fase 1: Configuración Inicial (con autorización)

- [ ] Clonar BarberApp → lashes-app
- [ ] Renombrar proyecto en package.json
- [ ] Actualizar `.env.example`
- [ ] Actualizar manifest.json
- [ ] Actualizar metadata de Next.js
- [ ] Actualizar globals.css con colores beauty
- [ ] Actualizar tailwind.config.ts
- [ ] Push a GitHub y verificar deploy

### Fase 2: Tipos y Datos (con autorización)

- [ ] Crear `src/types/salon.ts`
- [ ] Crear `src/types/servicio.ts`
- [ ] Crear `src/types/categoria.ts`
- [ ] Crear `src/types/especialista.ts`
- [ ] Crear `src/types/cliente.ts`
- [ ] Crear `src/types/producto.ts`
- [ ] Actualizar `src/types/roles.ts`
- [ ] Actualizar `src/lib/colors.ts`
- [ ] Actualizar `src/lib/constants.ts`
- [ ] Verificar `npx tsc --noEmit`

### Fase 3: UI y Componentes (con autorización)

- [ ] Actualizar Sidebar con labels beauty
- [ ] Actualizar ServiceCard con categorías
- [ ] Actualizar StatsCards
- [ ] Actualizar BookingFlow
- [ ] Actualizar landing /b/[slug]
- [ ] Crear nuevos componentes de belleza
- [ ] Verificar diseño responsive

### Fase 4: API Routes (con autorización)

- [ ] Renombrar endpoints barbero → especialista
- [ ] Renombrar barberia → salon
- [ ] Crear endpoint productos
- [ ] Crear endpoint clientes
- [ ] Actualizar endpoints puntos
- [ ] Actualizar firestore.rules
- [ ] Actualizar storage.rules
- [ ] Probar todos los endpoints con Postman

### Fase 5: Servicios y Catálogos (con autorización)

- [ ] Crear seed data de servicios beauty
- [ ] Implementar CRUD servicios con categorías
- [ ] Implementar filtros por categoría en UI
- [ ] Actualizar serviciosService

### Fase 6: Sistema de Citas (con autorización)

- [ ] Actualizar lógica de slots para beauty
- [ ] Actualizar servicio de citas
- [ ] Agregar tipo de cita (retoque)
- [ ] Probar anti-doble booking

### Fase 7: Programa de Lealtad (con autorización)

- [ ] Actualizar puntos por servicio beauty
- [ ] Agregar bonus cumpleaños
- [ ] Agregar puntos primera visita
- [ ] Actualizar UI de canjes
- [ ] Probar flujo completo de puntos

### Fase 8: WhatsApp y Automatizaciones (con autorización)

- [ ] Actualizar templates de mensajes beauty
- [ ] Configurar webhook WhatsApp
- [ ] Crear flujo n8n
- [ ] Probar mensajes automáticos

### Fase 9: Landing y QR (con autorización)

- [ ] Actualizar página /b/[slug] con branding beauty
- [ ] Agregar galería de trabajos
- [ ] Verificar QR codes
- [ ] Probar en móvil

### Fase 10: Documentación Final (con autorización)

- [ ] Actualizar README.md
- [ ] Actualizar CLAUDE.md
- [ ] Crear GUIA_ESPECIALISTAS.md
- [ ] Crear GUIA_CLIENTES.md
- [ ] Crear ESTRUCTURA_SERVICIOS.md
- [ ] Documentar lecciones aprendidas

---

## 8. COMANDOS ÚTILES

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev

# Validar compilación (OBLIGATORIO antes de push)
npm run build

# Validar TypeScript
npx tsc --noEmit

# Lint
npm run lint

# Formatear código
npm run format
```

### Git

```bash
# Ver estado
git status

# Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# Hacer commit
git add .
git commit -m "feat: agregar nueva funcionalidad"

# Push
git push origin feature/nueva-funcionalidad

# Hacer PR (desde GitHub Desktop o web)
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy preview
vercel

# Deploy production
vercel --prod

# Ver logs
vercel logs tu-proyecto
```

---

## 9. PROBLEMAS COMUNES Y SOLUCIONES

### Problema: "FIREBASE_PRIVATE_KEY format is invalid"

**Solución:** En Vercel, la variable debe tener `\n` literal, no saltos de línea reales:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...\n-----END PRIVATE KEY-----\n"
```

### Problema: "Missing or insufficient permissions"

**Solución:** Verificar Firestore rules. Si estás en modo test, las rules permiten todo. Si ya configuraste rules, verificar que el usuario tenga el rol correcto en Custom Claims.

### Problema: Custom Claims no se actualizan inmediatamente

**Solución:** Después de cambiar claims, forzar logout:
```typescript
await getAdminAuth().revokeRefreshTokens(uid)
```

### Problema: Deploy falló en Vercel pero local funciona

**Solución:**
1. Ver logs: `vercel logs`
2. Verificar que todas las variables de entorno estén en Vercel
3. Verificar que `npm run build` pasa localmente
4. Verificar que no hay imports de archivos que no existen

### Problema: Error de tipos en TypeScript

**Solución:**
```bash
npx tsc --noEmit
```
Revisar los errores y corregir los tipos.

### Problema: Cambios en Firestore no se reflejan

**Solución:**
1. Firestore tiene caché local. Hacer hard refresh o limpiar caché.
2. Si estás en dev, reiniciar `npm run dev`

---

## 10. CONTACTOS Y RECURSOS

### Documentación Oficial

- Firebase: https://firebase.google.com/docs
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Tailwind: https://tailwindcss.com/docs

### Soporte

- GitHub Issues del proyecto
- Documentación interna en `/docs`

---

*Documento generado para agente de implementación - Lashes & Nails App*
*Basado en lecciones aprendidas de BarberApp - Mayo 2026*
*NINGUNA Implementación se ejecutará sin autorización explícita del usuario*