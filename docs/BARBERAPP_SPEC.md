# BarberApp — Instrucciones Completas de Desarrollo

> **Propósito de este documento:** Este archivo contiene TODAS las especificaciones técnicas, flujos, reglas de negocio, estructura de base de datos, roles, permisos, mensajes, políticas y código de referencia necesarios para que un agente de IA o desarrollador construya la aplicación completa desde cero.

---

## 1. VISIÓN GENERAL

### 1.1 Qué es BarberApp
Plataforma SaaS multi-tenant para gestionar barberías. Un Super Admin (dueño de la plataforma) vende/renta el servicio a múltiples barberías. Cada barbería tiene su propio espacio aislado con sus barberos y clientes.

### 1.2 Stack tecnológico
| Componente | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 16.2 (App Router)** | React full-stack, rutas API + frontend en un repo |
| UI | React 19 + **Tailwind CSS v4** (CSS-first config) | CSS declarativo, sin archivo CSS externo |
| Lenguaje | **TypeScript strict** | Tipado fuerte en toda la base de código |
| Base de datos | Firebase Firestore | NoSQL, tiempo real, gratis hasta 10k usuarios |
| Autenticación | Firebase Authentication + **Custom Claims** | Login email/Google/teléfono + roles en el token JWT |
| Storage | Firebase Storage | Logos de barbería, iconos PWA |
| Bot WhatsApp | ManyChat (fase 1) → **n8n** (fase 2) | Automatización reservas por chat |
| Hosting | **Vercel** (frontend + API Routes) | Despliegue automático desde GitHub |
| PWA | `@ducanh2912/next-pwa` | App instalable sin tienda de apps |
| Pagos (opcional) | MercadoPago / Stripe | Cobro en línea dentro de la app |
| Notificaciones | Firebase Cloud Messaging + WhatsApp API | Push notifications + recordatorios |

### 1.3 Estructura del proyecto (Next.js App Router)
```
barberapp/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx          # Login/registro
│   │   ├── (auth)/register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/barberias/page.tsx   # Admin: gestión barberías
│   │   │   ├── admin/servicios/page.tsx   # Admin: servicios
│   │   │   ├── admin/barberos/page.tsx    # Admin: barberos
│   │   │   ├── barbero/page.tsx           # Dashboard barbero
│   │   │   ├── barbero/citas/page.tsx     # Agenda barbero
│   │   │   ├── cliente/reservar/page.tsx  # Cliente: reservar
│   │   │   ├── cliente/mis-citas/page.tsx # Cliente: historial
│   │   │   └── superadmin/page.tsx        # Super Admin
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # Auth handlers
│   │   │   ├── barberias/route.ts         # CRUD barberías
│   │   │   ├── citas/route.ts             # Crear/listar citas
│   │   │   └── webhooks/whatsapp/route.ts # Webhook ManyChat/n8n
│   │   ├── layout.tsx
│   │   ├── page.tsx                       # Landing / login
│   │   └── globals.css                    # Tailwind + variables
│   ├── components/
│   │   ├── ui/                            # Componentes reutilizables
│   │   ├── forms/                         # Formularios
│   │   └── layouts/                       # Sidebar, header, etc.
│   ├── hooks/                             # useAuth, useBarberia, useCitas
│   ├── lib/
│   │   ├── firebase.ts                    # Cliente Firebase SDK
│   │   ├── firebase-admin.ts              # Admin SDK (Cloud Functions)
│   │   └── utils.ts                       # Helpers (formato fecha, etc.)
│   └── types/
│       ├── firebase.ts                    # Interfaces: Barberia, Cita, Usuario
│       └── roles.ts                      # Enum Roles + permisos
├── public/
│   ├── manifest.json                      # PWA manifest
│   └── icons/                            # Iconos PWA (192x192, 512x512)
├── firestore.rules
├── firebase.json
└── next.config.ts
```

### 1.3 Modelo de negocio
- El Super Admin cobra renta mensual a cada barbería
- Plan Básico: $299 MXN/mes (1 barbero, 100 clientes)
- Plan Pro: $599 MXN/mes (5 barberos, clientes ilimitados, puntos, WhatsApp, reportes)
- Plan Cadena: $1,299 MXN/mes (sucursales ilimitadas, marca blanca, pagos integrados)

---

## 2. ROLES Y PERMISOS

### 2.1 Tabla de roles

| Rol | Código | Puede ver | No puede ver |
|---|---|---|---|
| Super Admin | `superadmin` | TODO: todas las barberías, todos los usuarios, métricas globales, planes, pagos, log de citas, errores del sistema | N/A — acceso total |
| Admin Barbería | `admin` | Su barbería: agenda, barberos, clientes, métricas, promociones, cancelaciones | Datos de otras barberías, planes de pago de la plataforma |
| Barbero | `barbero` | Su agenda propia, sus clientes, su calificación | Agenda de otros barberos, ingresos del negocio, lista completa de clientes |
| Cliente | `cliente` | Sus citas, su historial, sus puntos, su perfil | Datos de otros clientes, ingresos, métricas internas |

### 2.2 Regla de aislamiento
- Cada usuario tiene un campo `barberia_id` que lo vincula a UNA barbería
- Firebase Security Rules deben validar que `request.auth.token.barberia_id == resource.data.barberia_id` en CADA lectura y escritura
- El Super Admin es la única excepción — puede leer todas las colecciones sin restricción de `barberia_id`

### 2.3 Estructura de cada rol en Firebase Auth (Custom Claims)

```javascript
// Al crear un Super Admin
admin.auth().setCustomUserClaims(uid, {
  role: "superadmin"
});

// Al crear un Admin de barbería
admin.auth().setCustomUserClaims(uid, {
  role: "admin",
  barberia_id: "barberia_001"
});

// Al crear un Barbero
admin.auth().setCustomUserClaims(uid, {
  role: "barbero",
  barberia_id: "barberia_001",
  barbero_id: "barbero_003"
});

// Al crear un Cliente
admin.auth().setCustomUserClaims(uid, {
  role: "cliente",
  barberia_id: "barberia_001"
});
```

---

## 3. BASE DE DATOS — FIREBASE FIRESTORE

### 3.1 Colección: `barberias`

```
barberias/{barberia_id}
├── nombre: string           // "Barbería El Estilo"
├── logo: string             // URL de imagen
├── direccion: string        // "Av. Carranza 850, SLP"
├── telefono: string         // "+524441234567"
├── email: string            // "contacto@elestilo.mx"
├── plan: string             // "basico" | "pro" | "cadena"
├── estado: string           // "activa" | "suspendida" | "bloqueada" | "cancelada"
├── acceso_admin: boolean    // true = el admin puede entrar
├── reservas_activas: boolean // true = los clientes pueden reservar
├── creada_en: timestamp
├── ultimo_pago: timestamp
├── proximo_pago: timestamp
├── suspendida_en: timestamp | null
├── bloqueada_en: timestamp | null
├── horarios: map {
│   ├── lunes: { abre: "09:00", cierra: "20:00", activo: true }
│   ├── martes: { abre: "09:00", cierra: "20:00", activo: true }
│   ├── miercoles: { abre: "09:00", cierra: "20:00", activo: true }
│   ├── jueves: { abre: "09:00", cierra: "20:00", activo: true }
│   ├── viernes: { abre: "09:00", cierra: "20:00", activo: true }
│   ├── sabado: { abre: "10:00", cierra: "18:00", activo: true }
│   └── domingo: { abre: null, cierra: null, activo: false }
│   }
├── servicios: array [
│   { id: "srv_001", nombre: "Corte clásico", duracion_min: 30, precio: 120, activo: true },
│   { id: "srv_002", nombre: "Corte + barba", duracion_min: 50, precio: 180, activo: true },
│   { id: "srv_003", nombre: "Solo barba", duracion_min: 20, precio: 80, activo: true },
│   { id: "srv_004", nombre: "Degradado", duracion_min: 40, precio: 150, activo: true },
│   ]
└── dias_bloqueados: array ["2026-12-25", "2026-01-01"]  // días festivos / vacaciones
```

### 3.1.1 Sub-colección: `barberias/{barberia_id}/servicios_activos`

Los servicios NO se almacenan como array embebido — son una sub-colección para permitir toggle individual sin reescribir todo el documento.

```
barberias/{barberia_id}/servicios_activos/{servicioId}
├── id: string               // ID del catálogo (ej: "corte")
├── nombre: string            // "Corte clásico"
├── descripcion: string       // "Servicio de corte clásico"
├── precio: number            // 120
├── duracion_min: number      // 30
├── activo: boolean           // toggle activo/inactivo
├── creado_en: timestamp
└── actualizado_en: timestamp
```

### 3.2 Colección: `usuarios`

```
usuarios/{uid}
├── uid: string              // Firebase Auth UID
├── barberia_id: string      // FK a barberias
├── role: string             // "superadmin" | "admin" | "barbero" | "cliente"
├── nombre: string
├── email: string
├── telefono: string
├── foto_url: string | null
├── activo: boolean          // false = cuenta desactivada sin borrar
├── puntos: number           // Solo para clientes — puntos acumulados
├── creado_en: timestamp
├── ultimo_acceso: timestamp
├── metodo_login: string     // "email" | "google" | "phone"
├── email_verificado: boolean
│
│  // Solo para barberos:
├── barbero_id: string | null
├── servicios_que_ofrece: array [string]  // ["srv_001", "srv_002"]
├── calificacion_promedio: number
├── total_citas_completadas: number
│
│  // Solo para admin de barbería:
├── plan: string | null
└── es_dueno: boolean
```

### 3.3 Colección: `barberias/{barberia_id}/citas` (sub-colección)

```
barberias/{barberia_id}/citas/{cita_id}
├── barberia_id: string      // FK (duplicado para queries)
├── barbero_id: string       // FK
├── cliente_id: string       // FK (uid del cliente)
├── cliente_nombre: string   // Desnormalizado para consultas rápidas
├── cliente_telefono: string // Para enviar WhatsApp
├── servicio_id: string
├── servicio_nombre: string  // "Corte clásico"
├── precio: number           // 120
├── duracion_min: number     // 30
├── fecha: string            // "2026-05-04"
├── hora: string             // "10:00"
├── hora_fin: string         // "10:30" (calculada automáticamente)
├── estado: CitaEstado        // Ver estados abajo
├── canal: "pwa" | "whatsapp" | "qr"
├── agendada_en: timestamp
├── confirmacion_enviada_en: timestamp | null
├── recordatorio_enviado_en: timestamp | null
├── completada_en: timestamp | null
├── cancelada_en: timestamp | null
├── cancelada_por: "cliente" | "admin" | "barbero" | "sistema" | null
├── motivo_cancelacion: string | null
├── calificacion: number | null    // 1-5 estrellas
└── comentario: string | null
```

#### Estados posibles de una cita:
| Estado | Significado |
|---|---|
| `confirmada` | Cita agendada y confirmación enviada |
| `recordatorio_enviado` | El sistema envió el recordatorio 1h antes |
| `en_curso` | El barbero marcó que el cliente llegó |
| `completada` | Servicio terminado |
| `cancelada_cliente` | El cliente la canceló (con tiempo) |
| `cancelada_admin` | El dueño la canceló manualmente |
| `cancelada_barbero` | El barbero la canceló |
| `no_show` | El cliente no se presentó |

### 3.4 Colección: `metricas_mensuales`

```
metricas_mensuales/{barberia_id}_{mes}
├── barberia_id: string
├── mes: string              // "2026-05"
├── citas_totales: number
├── citas_completadas: number
├── citas_canceladas: number
├── citas_no_show: number
├── ingresos_estimados: number
├── clientes_nuevos: number
├── clientes_recurrentes: number
├── servicio_mas_pedido: string
├── barbero_mas_citas: string
├── tasa_cancelacion: number  // porcentaje
├── canales: map {
│   ├── pwa: number
│   ├── whatsapp: number
│   └── qr: number
│   }
└── actualizado_en: timestamp
```

### 3.5 Colección: `log_plataforma` (solo para Super Admin)

```
log_plataforma/{log_id}
├── tipo: string             // "cita_nueva" | "cita_cancelada" | "barberia_suspendida" | "error_whatsapp" | "pago_recibido"
├── barberia_id: string
├── barberia_nombre: string
├── detalle: string          // Descripción legible del evento
├── canal: string | null     // "pwa" | "whatsapp" | "qr"
├── timestamp: timestamp
└── metadata: map            // Datos adicionales variables
```

---

## 4. FIREBASE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones auxiliares
    function isAuthenticated() {
      return request.auth != null;
    }
    function isSuperAdmin() {
      return request.auth.token.role == "superadmin";
    }
    function isAdminOf(barberiaId) {
      return request.auth.token.role == "admin"
        && request.auth.token.barberia_id == barberiaId;
    }
    function isBarberoOf(barberiaId) {
      return request.auth.token.role == "barbero"
        && request.auth.token.barberia_id == barberiaId;
    }
    function isClienteOf(barberiaId) {
      return request.auth.token.role == "cliente"
        && request.auth.token.barberia_id == barberiaId;
    }
    function belongsTo(barberiaId) {
      return request.auth.token.barberia_id == barberiaId;
    }

    // Barberías
    match /barberias/{barberiaId} {
      allow read: if isSuperAdmin() || belongsTo(barberiaId);
      allow write: if isSuperAdmin();
      // Admin puede actualizar campos específicos de su barbería
      allow update: if isAdminOf(barberiaId)
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['estado', 'plan', 'acceso_admin']);
    }

    // Usuarios
    match /usuarios/{uid} {
      allow read: if isSuperAdmin()
        || request.auth.uid == uid
        || (isAdminOf(resource.data.barberia_id));
      allow create: if isSuperAdmin() || isAdminOf(request.resource.data.barberia_id);
      allow update: if isSuperAdmin() || request.auth.uid == uid;
      allow delete: if isSuperAdmin();
    }

    // Citas
    match /citas/{citaId} {
      // Super Admin ve todo
      allow read: if isSuperAdmin();
      // Admin y barbero ven citas de su barbería
      allow read: if belongsTo(resource.data.barberia_id);
      // Cliente solo ve sus propias citas
      allow read: if request.auth.uid == resource.data.cliente_id;
      // Crear cita: cliente autenticado de esa barbería
      allow create: if isAuthenticated()
        && belongsTo(request.resource.data.barberia_id);
      // Actualizar cita: admin, barbero de esa barbería, o el propio cliente
      allow update: if isSuperAdmin()
        || isAdminOf(resource.data.barberia_id)
        || isBarberoOf(resource.data.barberia_id)
        || (request.auth.uid == resource.data.cliente_id
            && request.resource.data.diff(resource.data).affectedKeys()
                .hasOnly(['estado', 'cancelada_en', 'cancelada_por']));
    }

    // Métricas mensuales
    match /metricas_mensuales/{docId} {
      allow read: if isSuperAdmin()
        || isAdminOf(resource.data.barberia_id);
      allow write: if false; // Solo el backend escribe métricas
    }

    // Log de plataforma
    match /log_plataforma/{logId} {
      allow read: if isSuperAdmin();
      allow write: if false; // Solo el backend escribe logs
    }
  }
}
```

---

## 5. API ROUTES (Next.js App Router)

Todas las API routes viven en `src/app/api/` y usan el formato App Router de Next.js (no Pages Router).

### 5.1 Autenticación y usuarios

```
POST   /api/auth/register-admin        → Crear admin de barbería (solo Super Admin)
POST   /api/auth/register-barbero      → Crear barbero (Admin de su barbería)
POST   /api/auth/register-cliente      → Auto-registro de cliente
POST   /api/auth/reset-password        → Enviar email de reset
PUT    /api/auth/update-email/:uid     → Corregir email equivocado (Super Admin / Admin)
DELETE /api/auth/delete-user/:uid      → Borrar usuario completo (Super Admin)
PUT    /api/auth/toggle-active/:uid    → Activar/desactivar sin borrar
POST   /api/auth/set-custom-claims     → Asignar Custom Claims + role (Super Admin only)
GET    /api/auth/me                     → Obtener usuario actual con role y barberia_id
```

### 5.2 Barberías

```
GET    /api/barberias                  → Listar todas (Super Admin)
GET    /api/barberias/:id              → Detalle de una barbería
POST   /api/barberias                  → Crear nueva barbería (Super Admin)
PUT    /api/barberias/:id              → Editar datos
PUT    /api/barberias/:id/estado       → Cambiar estado (activa/suspendida/bloqueada/cancelada)
PUT    /api/barberias/:id/horarios     → Actualizar horarios
PUT    /api/barberias/:id/servicios    → Actualizar servicios y precios
POST   /api/barberias/:id/dia-bloqueado → Agregar día festivo/vacaciones
DELETE /api/barberias/:id/dia-bloqueado → Quitar día bloqueado
POST   /api/barberias/:id/logo         → Subir logo a Firebase Storage
```

### 5.3 Citas

```
GET    /api/citas/disponibilidad       → Obtener slots disponibles (params: barberia_id, fecha, servicio_id, barbero_id?)
POST   /api/citas                      → Crear nueva cita (con transacción atómica)
GET    /api/citas/hoy/:barberia_id     → Citas de hoy para la barbería
GET    /api/citas/barbero/:barbero_id  → Agenda del barbero
GET    /api/citas/cliente/:cliente_id  → Historial del cliente
PUT    /api/citas/:id/completar        → Marcar como completada
PUT    /api/citas/:id/no-show          → Marcar como no se presentó
PUT    /api/citas/:id/cancelar         → Cancelar cita (con validación de tiempo)
GET    /api/citas/log/:barberia_id     → Log completo de citas (Super Admin y Admin)
```

### 5.4 Métricas

```
GET    /api/metricas/:barberia_id/:mes → Métricas de un mes
GET    /api/metricas/global/:mes       → Métricas globales de la plataforma (Super Admin)
GET    /api/metricas/dashboard         → Dashboard del Super Admin
```

### 5.5 Control de pagos (Super Admin)

```
PUT    /api/pagos/suspender/:barberia_id  → Suspender barbería por falta de pago
PUT    /api/pagos/bloquear/:barberia_id   → Bloquear barbería totalmente
PUT    /api/pagos/reactivar/:barberia_id  → Reactivar barbería al recibir pago
PUT    /api/pagos/cancelar/:barberia_id   → Cancelar barbería definitivamente
POST   /api/pagos/enviar-aviso/:barberia_id → Enviar aviso de pago por WhatsApp
```

### 5.6 Webhooks

```
POST   /api/webhooks/whatsapp          → Webhook ManyChat (fase 1)
POST   /api/webhooks/n8n               → Webhook n8n (fase 2)
```

---

## 6. SISTEMA DE HORARIOS Y DISPONIBILIDAD (Next.js API Route)

### 6.1 Quién configura los horarios
El Admin de la barbería los configura al registrarse y puede editarlos en cualquier momento desde `Panel → Configuración → Horarios`.

### 6.2 Cómo se generan los slots disponibles

```javascript
// Algoritmo para generar slots
function generarSlots(barberia, fecha, servicio_id) {
  const dia = getDiaSemana(fecha); // "lunes", "martes", etc.
  const horario = barberia.horarios[dia];

  // Si el día no está activo o es día bloqueado, retorna vacío
  if (!horario.activo || barberia.dias_bloqueados.includes(fecha)) {
    return [];
  }

  const servicio = barberia.servicios.find(s => s.id === servicio_id);
  const duracion = servicio.duracion_min;

  // Generar slots desde hora apertura hasta cierre
  const slots = [];
  let current = parseTime(horario.abre); // e.g., 540 (9:00 en minutos)
  const cierre = parseTime(horario.cierra); // e.g., 1200 (20:00 en minutos)

  while (current + duracion <= cierre) {
    slots.push({
      hora: formatTime(current),          // "09:00"
      hora_fin: formatTime(current + duracion), // "09:30"
      disponible: true // se marca como false si ya hay cita
    });
    current += 30; // slots cada 30 minutos
  }

  // Consultar citas existentes para esa fecha y barbería
  const citasExistentes = await getCitasDelDia(barberia.id, fecha);

  // Marcar slots ocupados
  for (const cita of citasExistentes) {
    if (cita.estado === 'cancelada_cliente' || cita.estado === 'cancelada_admin') continue;
    const citaInicio = parseTime(cita.hora);
    const citaFin = parseTime(cita.hora_fin);
    for (const slot of slots) {
      const slotInicio = parseTime(slot.hora);
      const slotFin = parseTime(slot.hora_fin);
      // Si hay traslape, marcar como no disponible
      if (slotInicio < citaFin && slotFin > citaInicio) {
        slot.disponible = false;
        slot.cita_id = cita.cita_id; // referencia
      }
    }
  }

  return slots.filter(s => s.disponible);
}
```

### 6.3 Prevención de doble reserva
- Al crear una cita, el backend verifica en una transacción atómica de Firestore que el slot sigue disponible
- Si dos clientes intentan reservar el mismo horario simultáneamente, solo el primero lo obtiene
- El segundo recibe error y debe elegir otro horario

```javascript
// Transacción atómica para crear cita
async function crearCita(datosCita) {
  return db.runTransaction(async (transaction) => {
    // 1. Verificar que no existe cita en ese slot
    const citasRef = db.collection('citas')
      .where('barberia_id', '==', datosCita.barberia_id)
      .where('barbero_id', '==', datosCita.barbero_id)
      .where('fecha', '==', datosCita.fecha)
      .where('hora', '==', datosCita.hora)
      .where('estado', 'not-in', ['cancelada_cliente', 'cancelada_admin', 'no_show']);

    const existing = await transaction.get(citasRef);
    if (!existing.empty) {
      throw new Error('SLOT_OCUPADO');
    }

    // 2. Verificar que la barbería está activa
    const barberiaDoc = await transaction.get(
      db.collection('barberias').doc(datosCita.barberia_id)
    );
    if (barberiaDoc.data().estado !== 'activa' || !barberiaDoc.data().reservas_activas) {
      throw new Error('BARBERIA_NO_DISPONIBLE');
    }

    // 3. Crear la cita
    const citaRef = db.collection('citas').doc();
    transaction.set(citaRef, {
      ...datosCita,
      cita_id: citaRef.id,
      estado: 'confirmada',
      agendada_en: admin.firestore.FieldValue.serverTimestamp()
    });

    return citaRef.id;
  });
}
```

---

## 7. POLÍTICA DE CANCELACIONES

### 7.1 Reglas para el CLIENTE

```typescript
const LIMITE_CANCELACION_MINUTOS = 60; // 1 hora antes

function puedeClienteCancelar(cita: Cita): boolean {
  const ahora = new Date();
  const horaCita = parseFechaHora(cita.fecha, cita.hora);
  const diferencia = (horaCita.getTime() - ahora.getTime()) / (1000 * 60); // minutos

  return diferencia >= LIMITE_CANCELACION_MINUTOS;
}
```

#### Si PUEDE cancelar (>= 1 hora antes):
- El botón "Cancelar cita" está activo
- Al confirmar: estado cambia a `cancelada_cliente`
- El slot se libera automáticamente
- Se envía WhatsApp de confirmación de cancelación

#### Si NO PUEDE cancelar (< 1 hora antes):
- El botón está DESHABILITADO
- Se muestra mensaje: "Las cancelaciones solo se permiten con al menos 1 hora de anticipación. Si tienes algún problema, comunícate directamente con la barbería al número [teléfono]."

### 7.2 Reglas para el ADMIN / DUEÑO
- El dueño puede cancelar CUALQUIER cita en CUALQUIER momento, sin restricción de tiempo
- Debe seleccionar un motivo de cancelación:
  - `no-llego` — Cliente no se presentó (después de 15 min)
  - `barbero-enfermo` — Barbero con emergencia
  - `cliente-llamo` — Cliente solicitó cancelación por teléfono
  - `cierre` — Cierre imprevisto de la barbería
  - `otro` — Otro motivo

### 7.3 Reglas para el BARBERO
- Puede marcar como `no_show` si el cliente no llega después de 15 minutos
- Puede marcar como `completada` al terminar el servicio
- NO puede cancelar directamente — debe pedir al admin

---

## 8. MENSAJES AUTOMÁTICOS DE WHATSAPP

### 8.1 Al confirmar una cita nueva

```
✅ ¡Cita confirmada!

📋 Servicio: {servicio_nombre}
📅 Fecha: {fecha_formateada}
🕙 Hora: {hora}
💈 Barbero: {barbero_nombre}
💰 Precio: ${precio} MXN

📍 {barberia_nombre}
{barberia_direccion}

Te recordaremos 1 hora antes. ¡Nos vemos!
```

### 8.2 Recordatorio 1 hora antes

```
⏰ Recordatorio de cita

En 1 hora tienes tu cita en {barberia_nombre}.

🕙 {hora} con {barbero_nombre}
✂ {servicio_nombre} — ${precio} MXN

¿Necesitas cancelar? Solo puedes hacerlo hasta las {hora_limite_cancelacion}.
Responde CANCELAR si ya no puedes asistir.
```

### 8.3 Al cancelar exitosamente (cliente con tiempo)

```
Tu cita ha sido cancelada exitosamente.

📅 {fecha_formateada} a las {hora}
✂ {servicio_nombre}

El horario quedó libre.
¿Deseas reagendar? Escribe REAGENDAR o visita {link_barberia}
```

### 8.4 Al intentar cancelar fuera de tiempo

```
Lo sentimos, no es posible cancelar tu cita.

⛔ Las cancelaciones solo se permiten con al menos 1 hora de anticipación.

Tu cita es a las {hora} — el tiempo límite para cancelar ya pasó ({hora_limite}).

Si tienes algún problema, contáctanos directamente:
📞 {barberia_telefono}
```

### 8.5 Cancelación por el dueño/barbería

```
Tu cita ha sido cancelada.

Lamentamos los inconvenientes. Tu cita del:
📅 {fecha_formateada} · {hora}
fue cancelada por la barbería.

Motivo: {motivo_legible}

¿Deseas reagendar?
👉 Escribe REAGENDAR para ver horarios disponibles
o visita: {link_barberia}
```

### 8.6 Aviso de pago pendiente (Super Admin → Dueño barbería)

```
⚠ Aviso de pago — BarberApp

Tu plan {plan_nombre} de BarberApp venció el {fecha_vencimiento}.

Precio del plan: ${precio_plan} MXN/mes

Si no realizas tu pago:
📅 Día +3: Se suspenden las reservas de tus clientes
🔒 Día +7: Se bloquea tu acceso completo al panel

Realiza tu pago para continuar sin interrupciones.
¿Necesitas ayuda? Responde a este mensaje.
```

---

## 9. SISTEMA DE CONTROL DE PAGOS (Firebase Cloud Functions)

### 9.1 Estados de barbería

```typescript
const ESTADOS_BARBERIA = {
  activa: {
    acceso_admin: true,
    reservas_activas: true,
    bot_whatsapp: true,
    descripcion: "Todo funciona normal"
  },
  suspendida: {
    acceso_admin: true,         // El dueño puede entrar pero ve banner
    reservas_activas: false,    // Los clientes NO pueden reservar
    bot_whatsapp: true,         // El bot sigue respondiendo pero dice que no hay citas
    descripcion: "Pago vencido — sin nuevas reservas"
  },
  bloqueada: {
    acceso_admin: false,        // El dueño NO puede entrar
    reservas_activas: false,    // Sin reservas
    bot_whatsapp: false,        // Bot no responde
    descripcion: "Sin pago +7 días — acceso bloqueado"
  },
  cancelada: {
    acceso_admin: false,        // Sin acceso
    reservas_activas: false,    // Sin reservas
    bot_whatsapp: false,        // Bot desactivado
    descripcion: "Cancelación definitiva — datos en modo lectura 30 días"
  }
};
```

### 9.2 Flujo automático de impago (Firebase Cloud Function — scheduled)

```typescript
// Función Cloud Function scheduled (cron: every 24h)
export const verificarPagos = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const barberias = await db.collection('barberias')
      .where('estado', '==', 'activa')
      .get();

    const hoy = new Date();

    for (const doc of barberias.docs) {
      const data = doc.data();
      const proximoPago = data.proximo_pago.toDate();
      const diasVencido = Math.floor((hoy.getTime() - proximoPago.getTime()) / (1000*60*60*24));

      if (diasVencido >= 1 && diasVencido < 3) {
        await enviarAvisoPago(doc.id, data);
        await registrarLog('aviso_pago', doc.id, data.nombre);
      }

      if (diasVencido >= 3 && diasVencido < 7) {
        await doc.ref.update({
          estado: 'suspendida',
          reservas_activas: false,
          suspendida_en: FieldValue.serverTimestamp()
        });
        await registrarLog('barberia_suspendida', doc.id, data.nombre);
      }

      if (diasVencido >= 7) {
        await doc.ref.update({
          estado: 'bloqueada',
          acceso_admin: false,
          bloqueada_en: FieldValue.serverTimestamp()
        });
        await registrarLog('barberia_bloqueada', doc.id, data.nombre);
      }
    }
  });
```

### 9.3 Reactivación al recibir pago (Cloud Function)

```typescript
export const reactivarBarberia = functions.https.onCall(async (data, context) => {
  // Solo superadmin puede llamar esta función
  if (context.auth?.token?.role !== 'superadmin') {
    throw new functions.https.HttpsError('permission-denied', 'Solo Super Admin');
  }

  const { barberiaId } = data;
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.collection('barberias').doc(barberiaId).update({
    estado: 'activa',
    acceso_admin: true,
    reservas_activas: true,
    ultimo_pago: FieldValue.serverTimestamp(),
    proximo_pago: Timestamp.fromDate(nextMonth),
    suspendida_en: null,
    bloqueada_en: null
  });

  await registrarLog('barberia_reactivada', barberiaId, 'Pago recibido');
});
```

---

## 10. SISTEMA DE PUNTOS Y FIDELIZACIÓN

### 10.1 Reglas de acumulación
- Cada servicio completado otorga puntos según su precio:
  - Corte clásico ($120) → 50 puntos
  - Corte + barba ($180) → 80 puntos
  - Solo barba ($80) → 30 puntos
  - Degradado ($150) → 60 puntos
- Fórmula general: `puntos = Math.round(precio * 0.4)`

### 10.2 Reglas de canje
- 1,000 puntos = 1 corte clásico gratis
- El canje se registra como una cita con precio $0 y nota "Canje de puntos"

### 10.3 Eventos especiales
- Cumpleaños: doble puntos ese día (si el campo `fecha_nacimiento` existe en el perfil del cliente)
- Promociones del admin: el dueño puede activar "2x puntos" para un fin de semana desde su panel

---

## 11. MÉTODOS DE AUTENTICACIÓN

### 11.1 Configurar Firebase Auth
Activar los siguientes proveedores en Firebase Console → Authentication → Sign-in method:

1. **Email/Password** — Activar. Gratis.
2. **Google** — Activar. Gratis. RECOMENDADO como método principal.
3. **Phone (SMS)** — Activar. Costo: $0.01 USD/SMS.

### 11.2 Verificación de email obligatoria
- Al registrarse con email/contraseña, el cliente recibe un email de verificación
- NO puede agendar su primera cita hasta confirmar su email
- Si se registra con Google, el email ya está verificado

### 11.3 Gestión de usuarios desde el panel

| Operación | Quién puede | Método |
|---|---|---|
| Reset de contraseña | Super Admin, o el propio cliente | `sendPasswordResetEmail(auth, email)` |
| Corregir email | Super Admin, Admin de barbería | `admin.auth().updateUser(uid, { email })` + actualizar en Firestore |
| Borrar cuenta | Solo Super Admin | `admin.auth().deleteUser(uid)` + borrar docs en Firestore + cancelar citas |
| Desactivar sin borrar | Super Admin, Admin | Cambiar `activo: false` en Firestore |

---

## 12. ACCESO SIN APP STORE — 3 CANALES

### 12.1 PWA (Progressive Web App — Next.js)
- La app se construye como PWA con `@ducanh2912/next-pwa`
- Archivos: `public/manifest.json` + `public/icons/` + `next.config.ts` con configuración PWA
- Al entrar desde Chrome (Android) o Safari (iOS), el navegador sugiere "Agregar a pantalla de inicio"
- Soporta: notificaciones push, cache offline parcial, pantalla completa sin barra del navegador
- Cada barbería tiene su propia URL: `barberapp.vercel.app/b/{slug}` (ruta landing page QR)

### 12.2 Bot de WhatsApp
- Fase 1: ManyChat conectado a WhatsApp Business API → webhook en `POST /api/webhooks/whatsapp`
- Fase 2: Bot propio con n8n o Cloud Function → webhook en `POST /api/webhooks/n8n`
- Flujo: cliente escribe "Hola" → bot muestra menú → elige servicio → elige horario → confirma
- La cita se crea llamando a la API del backend: `POST /api/citas`

### 12.3 Código QR
- Se genera un QR con la URL de la barbería: `barberapp.vercel.app/b/{slug}?utm_source=qr`
- El parámetro `utm_source=qr` permite registrar que la cita vino del QR
- El admin lo imprime y lo coloca en su local (espejo, mostrador, puerta)
- URL configurable desde el panel admin

---

## 13. RUTAS DE LA APP (Next.js App Router — por rol)

### 13.1 Super Admin

```
/superadmin                 → Dashboard: métricas globales, barberías activas, citas totales hoy
/superadmin/barberias       → Lista de barberías con filtros por estado
/superadmin/barberias/[id]  → Detalle: citas, métricas, estado de pago, barberos
/superadmin/barberias/[id]/citas → Log completo de citas con canal, hora, estado
/superadmin/usuarios        → Lista global de usuarios con búsqueda
/superadmin/usuarios/[uid]  → Detalle: reset pass, editar email, desactivar, borrar
/superadmin/log             → Log de plataforma en tiempo real
/superadmin/pagos           → Control de pagos: suspender, bloquear, reaccionar
/superadmin/config          → Configuración de la plataforma
```

### 13.2 Admin Barbería

```
/admin/dashboard            → Citas de hoy, ingresos, cancelaciones, origen de citas
/admin/agenda               → Calendario semanal/mensual de todos los barberos
/admin/agenda/[fecha]       → Vista del día con slots hora por hora
/admin/barberos             → Gestión de barberos (crear, editar, desactivar)
/admin/clientes             → Lista de clientes con búsqueda, puntos, historial
/admin/servicios            → Activar/desactivar servicios, precios, duración
/admin/horarios             → Configurar días, horas, días bloqueados
/admin/qr                   → Ver y descargar QR para imprimir
/admin/metricas             → Reportes mensuales detallados
/admin/config               → Datos del negocio, logo, dirección
```

### 13.3 Barbero

```
/barbero                    → Dashboard: citas del día, total ventas, nächste citas
/barbero/citas              → Agenda del día: hora por hora de sus citas
/barbero/historial          → Citas completadas con calificaciones
/barbero/config             → Configurar sus servicios disponibles
```

### 13.4 Cliente

```
/cliente                     → Dashboard: próximas citas, puntos acumulados, código QR personal
/cliente/reservar             → Reservar nueva cita: seleccionar servicio → barbero → fecha → hora
/cliente/mis-citas            → Historial de citas y puntos
/cliente/canjear              → Canjear puntos por servicios
/cliente/perfil               → Editar perfil, teléfono, notificaciones
```

---

## 14. NOTIFICACIONES Y CRON JOBS (Firebase Cloud Functions)

### 14.1 Cloud Functions scheduled

| Función | Programación | Qué hace |
|---|---|---|
| `verificarPagos` | Diario 00:00 | Revisa pagos vencidos → suspende / bloquea |
| `enviarRecordatorios` | Cada 15 min | Busca citas en +60 min sin recordatorio → envía WhatsApp |
| `actualizarMetricas` | Diario 23:00 | Recalcula métricas del día para cada barbería |
| `limpiarNoShows` | Diario 21:00 | Marca `no_show` citas confirmadas sin completarse |

### 14.2 Notificaciones push (PWA — Firebase Cloud Messaging)

```typescript
// Registrar Service Worker para push notifications
if ('serviceWorker' in navigator && 'PushManager' in window) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY
  });
  // Guardar subscription en Firestore
  await updateDoc(doc(db, 'usuarios', uid), {
    push_subscription: JSON.parse(JSON.stringify(subscription))
  });
}
```

---

## 15. ESTRUCTURA DEL PROYECTO (Next.js 16.2 App Router)

```
barberapp/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx              # Dashboard admin
│   │   │   │   ├── barberias/page.tsx
│   │   │   │   ├── barberos/page.tsx
│   │   │   │   ├── clientes/page.tsx
│   │   │   │   ├── servicios/page.tsx
│   │   │   │   ├── horarios/page.tsx
│   │   │   │   ├── qr/page.tsx
│   │   │   │   ├── metricas/page.tsx
│   │   │   │   └── config/page.tsx
│   │   │   ├── barbero/
│   │   │   │   ├── page.tsx              # Dashboard barbero
│   │   │   │   └── citas/page.tsx
│   │   │   ├── cliente/
│   │   │   │   ├── page.tsx              # Dashboard cliente
│   │   │   │   ├── reservar/page.tsx
│   │   │   │   ├── mis-citas/page.tsx
│   │   │   │   ├── canjear/page.tsx
│   │   │   │   └── perfil/page.tsx
│   │   │   └── superadmin/
│   │   │       ├── page.tsx
│   │   │       ├── barberias/page.tsx
│   │   │       ├── usuarios/page.tsx
│   │   │       ├── pagos/page.tsx
│   │   │       └── log/page.tsx
│   │   ├── b/[slug]/page.tsx             # Landing page QR (dinámica)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── barberias/route.ts
│   │   │   ├── citas/route.ts
│   │   │   ├── citas/disponibilidad/route.ts
│   │   │   ├── webhooks/whatsapp/route.ts
│   │   │   └── webhooks/n8n/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                          # shadcn/ui o componentes propios
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── modal.tsx
│   │   │   └── slot-picker.tsx
│   │   ├── layouts/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── shared/
│   │       ├── calendario-citas.tsx
│   │       ├── lista-citas.tsx
│   │       └── metric-cards.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCitas.ts
│   │   ├── useHorarios.ts
│   │   ├── useMetricas.ts
│   │   └── useBarberia.ts
│   ├── lib/
│   │   ├── firebase.ts                  # Cliente Firebase SDK
│   │   ├── firebase-admin.ts           # Admin SDK
│   │   ├── utils.ts                     # Helpers: formatFecha, parseTime, etc.
│   │   └── constants.ts                 # Valores fijos: planes, puntos, etc.
│   └── types/
│       ├── firebase.ts                 # Interfaces: Barberia, Cita, Usuario, etc.
│       └── roles.ts                    # Enum Roles + permisos + helper types
├── public/
│   ├── manifest.json                   # PWA manifest
│   └── icons/                          # App icons (192x192, 512x512)
├── functions/                          # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── verificarPagos.ts
│   │   ├── enviarRecordatorios.ts
│   │   └── index.ts
│   └── package.json
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 16. TEMA VISUAL Y DISEÑO

### 16.1 Paleta de colores

```css
:root {
  --dark:    #0D1117;    /* Fondo principal */
  --navy:    #1E3A5F;    /* Headers, barras */
  --card:    #161B22;    /* Tarjetas */
  --gold:    #C9A84C;    /* Acento principal — barbería clásica */
  --white:   #F0F6FF;    /* Texto principal */
  --muted:   #8B949E;    /* Texto secundario */
  --teal:    #0D9488;    /* Éxito, estados activos */
  --green:   #22C55E;    /* Gratis, disponible */
  --red:     #EF4444;    /* Error, bloqueado */
  --amber:   #F59E0B;    /* Advertencia, suspensión */
  --purple:  #8B5CF6;    /* Super Admin */
  --blue:    #3B82F6;    /* Info, cliente */
}
```

### 16.2 Tipografía
- Headers: Bebas Neue (o similar display bold)
- Body: DM Sans (o similar sans-serif limpia)
- Código: DM Mono

### 16.3 Estilo general
- Tema oscuro por defecto (estilo barbería premium)
- Border radius: 12px en tarjetas, 8px en botones, 20px en badges
- Bordes sutiles: 1px solid rgba(201,168,76,0.18)
- Sin sombras pesadas — bordes dorados sutiles para separación

---

## 17. VARIABLES DE ENTORNO

```env
# Firebase (cliente)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=barberapp-ant-2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=barberapp-ant-2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=barberapp-ant-2026.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (API routes — credentials en JSON)
FIREBASE_ADMIN_PROJECT_ID=barberapp-ant-2026
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# WhatsApp API
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# ManyChat (fase 1)
MANYCHAT_API_KEY=

# n8n (fase 2)
N8N_WEBHOOK_URL=

# WhatsApp Provider switch (cambiar a 'n8n' para fase 2)
WHATSAPP_PROVIDER=manychat

# PWA
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Dominio
NEXT_PUBLIC_APP_URL=https://barberapp.vercel.app
```

---

## 18. ORDEN DE DESARROLLO COMPLETADO

### ✅ Fase 1 — MVP
1. ✅ Setup proyecto (Next.js 16.2 + React 19 + Tailwind 4)
2. ✅ Autenticación + Custom Claims (Firebase Auth + Admin SDK)
3. ✅ Folder structure + TypeScript types
4. ✅ Sistema de roles (4 roles + Security Rules)
5. ✅ CRUD Barberías + logo upload a Firebase Storage
6. ✅ Gestión de servicios (5 fijos: Corte, Barba, Bigote, Afeitado, Facial)
7. ✅ Motor de horarios/slots
8. ✅ Crear/cancelar citas (transacción atómica)
9. ✅ Dashboard Admin Barbería
10. ✅ Dashboard Barbero (ventas diarias)

### ✅ Fase 2 — Funcionalidad completa
11. ✅ Sistema de puntos (acumulación + canje)
12. ✅ Dashboard Cliente
13. ✅ Dashboard Super Admin
14. ✅ WhatsApp Bot (ManyChat fase 1) — webhook en `POST /api/webhooks/whatsapp`
15. ✅ Mensajes automáticos (confirmación, recordatorio, cancelación)
16. ✅ PWA setup (`@ducanh2912/next-pwa` + manifest)
17. ✅ Sistema QR (generador + landing page `/b/[slug]`)
18. ✅ Deploy a Vercel + Firebase Hosting

### Fase 3 — Pendiente
19. Cloud Functions para pagos (verificarPagos, enviarRecordatorios, actualizarMetricas)
20. Log de plataforma en tiempo real
21. Sistema QR con landing page `/b/[slug]`
22. Migración ManyChat → n8n (cuando aplique)

### Fase 4 — Pendiente
23. Notificaciones push PWA
24. Calificaciones y reviews
25. Promociones y descuentos
26. Analytics avanzados

---

## 19. INTERFAZ ABSTRACTA PARA WHATSAPP (PREPARADO PARA FASE 2)

### 19.1 Principio rector
> **"Escribe código para lo que viene, no para lo que tienes."** — Fase 1 usa ManyChat pero el código está diseñado para migrar a n8n sin reescribir lógica de negocio.

### 19.2 Interfaz IWhatsAppProvider

```typescript
// src/services/whatsapp/IWhatsAppProvider.ts
export interface IWhatsAppProvider {
  enviarConfirmacion(cita: Cita): Promise<void>;
  enviarRecordatorio(cita: Cita): Promise<void>;
  enviarCancelacion(cita: Cita, motivo: string): Promise<void>;
  enviarAvisoPago(barberia: Barberia, diasVencido: number): Promise<void>;
}
```

### 19.3 Implementaciones por fase

```typescript
// src/services/whatsapp/ManyChatProvider.ts — FASE 1
export class ManyChatProvider implements IWhatsAppProvider {
  constructor(private apiKey: string) {}

  async enviarConfirmacion(cita: Cita): Promise<void> {
    // POST https://api.manychat.com/cc/sendMessage
    // Body: { phone: cita.cliente_telefono, message: template_confirmacion }
  }

  async enviarRecordatorio(cita: Cita): Promise<void> { /* ... */ }
  async enviarCancelacion(cita: Cita, motivo: string): Promise<void> { /* ... */ }
  async enviarAvisoPago(barberia: Barberia, diasVencido: number): Promise<void> { /* ... */ }
}

// src/services/whatsapp/N8nProvider.ts — FASE 2
export class N8nProvider implements IWhatsAppProvider {
  constructor(private webhookUrl: string) {}

  async enviarConfirmacion(cita: Cita): Promise<void> {
    // POST a tu webhook de n8n: https://tu-servidor.com/webhook/whatsapp
    // body: { action: 'confirmacion', cita: {...} }
  }

  async enviarRecordatorio(cita: Cita): Promise<void> { /* ... */ }
  async enviarCancelacion(cita: Cita, motivo: string): Promise<void> { /* ... */ }
  async enviarAvisoPago(barberia: Barberia, diasVencido: number): Promise<void> { /* ... */ }
}
```

### 19.4 Archivo de configuración — el único lugar que cambias para migrar

```typescript
// src/config/whatsapp.ts

// =====================
// PARA MIGRAR A FASE 2
// =====================
// 1. Cambiar PROVIDER a 'n8n'
// 2. Agregar N8N_WEBHOOK_URL en .env
// 3. Agregar N8N_API_KEY en .env
// 4. Desactivar bot en ManyChat
// 5. Cambiar webhook en WhatsApp Business de ManyChat a n8n
// =====================

export type WhatsAppProviderType = 'manychat' | 'n8n';
export const WHATSAPP_PROVIDER: WhatsAppProviderType = 'manychat'; // ← Cambiar a 'n8n' cuando migrated

export const whatsappConfig = {
  manychat: {
    apiKey: process.env.MANYCHAT_API_KEY,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL,
    apiKey: process.env.N8N_API_KEY,
  }
};

// Factory que entrega el provider correcto
import { ManyChatProvider } from './ManyChatProvider';
import { N8nProvider } from './N8nProvider';

export function getWhatsAppProvider(): IWhatsAppProvider {
  if (WHATSAPP_PROVIDER === 'n8n') {
    return new N8nProvider(whatsappConfig.n8n.webhookUrl);
  }
  return new ManyChatProvider(whatsappConfig.manychat.apiKey);
}
```

### 19.5 Uso en el código — donde sea que se envíe un mensaje

```typescript
// src/services/citas.service.js (backend)
// Donde sea que se envía WhatsApp, se usa el provider abstracto

import { getWhatsAppProvider } from '../config/whatsapp';

async function crearCita(datosCita) {
  const citaId = await db.runTransaction(async (transaction) => {
    // ... transacción atómica de doble reserva (sección 6.3 del spec)
  });

  // Enviar confirmación por WhatsApp — NO importa si es ManyChat o n8n
  const provider = getWhatsAppProvider();
  await provider.enviarConfirmacion(cita);

  return citaId;
}
```

### 19.6 Endpoint receptor para n8n (FASE 2)

Cuando migraras a n8n, el bot recibirpa mensajes de WhatsApp y crearpa citas. Se necesita este endpoint:

```javascript
// backend/src/routes/whatsapp.routes.js

// Este endpoint recibe eventos de n8n (webhook de WhatsApp)
router.post('/webhook/n8n', async (req, res) => {
  const { action, cita_data } = req.body;

  if (action === 'nueva_reserva') {
    // Crear cita via API (misma lógica que cliente desde PWA)
    const result = await crearCitaDesdeWhatsApp(cita_data);
    // Responder a n8n para que mande confirmación
    return res.json({ success: true, cita_id: result });
  }

  if (action === 'cancelacion') {
    const { cita_id, motivo } = cita_data;
    await cancelarCita(cita_id, motivo);
    return res.json({ success: true });
  }

  res.status(400).json({ error: ' Acción desconocida' });
});
```

---

## 20. INDICADORES PARA DECIDIR CUÁNDO MIGRAR A FASE 2

> Tú decides — el código está listo, solo es cambiar un string en la config.

| Indicador | Condición para migrar |
|---|---|
| **Volumen WhatsApp** | > 500 citas/mes vía WhatsApp |
| **Costo ManyChat** | > $50 USD/mes (plan profesional necesario) |
| **Personalización del bot** | Flujos complejos que ManyChat no soporta bien |
| **Datos propios** | Quiere自家 avere datos/analíticas de conversaciones |
| **Multi-barbería** | Un bot para varias barberías (ManyChat limita en plan gratis) |
| **Control total** | No depender de plataforma third-party |
| **API propia** | Necesitas que el bot interactúe con tu backend de formas que ManyChat no permite |

### Checklist de migración (2-4 horas)

```bash
# 1. Configurar n8n
n8n self-hosted en Railway ($5/mes) o n8n.cloud
Crear workflow: WhatsApp Webhook → Validar datos → Crear cita en Firestore → Responder

# 2. Cambiar config (solo 1 archivo)
# src/config/whatsapp.ts
WHATSAPP_PROVIDER = 'n8n'
# .env agregar N8N_WEBHOOK_URL y N8N_API_KEY

# 3. Cambiar webhook en WhatsApp Business
# Ir a WhatsApp Business → Webhooks → cambiar URL de ManyChat a n8n

# 4. Desactivar ManyChat (archivarlo, no borrar)
# ManyChat → Settings → Deactivate

# 5. Testing
# Enviar "Hola" desde un celular → n8n recibe → crea cita → envía confirmación
```

---

## 21. COMANDOS PARA INICIAR EL PROYECTO (Next.js 16.2 + Firebase)

> **Stack actual:** Next.js 16.2 + React 19 + Tailwind CSS v4 + Firebase 11+

```bash
# 1. Crear proyecto (ya existe en barberapp/)
# cd barberapp && npm run dev

# 2. Dependencias core (ya instaladas en barberapp/)
# firebase, react-firebase-hooks, zustand ya vienen con el proyecto base

# 3. PWA
npm install @ducanh2912/next-pwa

# 4. QR codes
npm install qrcode.react

# 5. Firebase CLI (global)
npm install -g firebase-tools
firebase login
firebase init  # Firestore rules, Hosting, Functions

# 6. Deploy a Vercel (frontend + API routes)
npx vercel --prod

# 7. Deploy Firebase (Functions + Hosting)
firebase deploy

# 8. Desarrollo local
npm run dev
```

### Estructura de carpetas (Next.js)

```
barberapp/
├── src/
│   ├── app/                    # App Router ( Next.js 14)
│   │   ├── (auth)/            # Grupo: login, register, reset-password
│   │   ├── (dashboard)/       # Grupo: después de login
│   │   │   ├── admin/         # Super Admin
│   │   │   ├── barberia/      # Admin Barbería
│   │   │   ├── barbero/       # Barbero
│   │   │   └── cliente/       # Cliente
│   │   ├── api/               # API Routes (backend)
│   │   │   ├── auth/
│   │   │   ├── barberias/
│   │   │   ├── citas/
│   │   │   ├── metricas/
│   │   │   └── webhooks/
│   │   │       └── n8n/       # ← Listo para fase 2
│   │   └── page.tsx           # Landing / redirect
│   ├── components/
│   │   ├── ui/                # Componentes reutilizables
│   │   ├── auth/              # Auth forms
│   │   └── dashboard/         # Por rol
│   ├── lib/
│   │   ├── firebase/          # Cliente Firebase
│   │   └── firebase-admin/    # Admin SDK (para API routes y Cloud Functions)
│   ├── hooks/
│   ├── services/
│   │   └── whatsapp/          # ← Interfaz abstracta (fase 1 y 2)
│   ├── config/
│   │   └── whatsapp.ts        # ← UNICO archivo a cambiar para migrar
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── public/
│   ├── manifest.json          # PWA
│   └── icons/                 # App icons
├── functions/                  # Cloud Functions (cron jobs)
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── verificar-pagos.ts
│   │   │   ├── enviar-recordatorios.ts
│   │   │   └── actualizar-metricas.ts
│   │   └── index.ts
│   └── package.json
├── firebase/
│   ├── firestore.rules        # ← Ya está en el spec (sección 4)
│   └── firestore.indexes.json
├── .env.local                 # Variables locales (NO COMMITEAR)
├── .gitignore
└── README.md
```

---

## 22. NOTAS IMPORTANTES

### 22.1 Cómo está preparado para fase 2 sin costo extra ahora
- La interfaz `IWhatsAppProvider` se implementa desde día 1
- El endpoint `/api/webhooks/n8n` se crea desde día 1 (vacío, pero la ruta existe)
- Transacciones atómicas de Firestore permiten que n8n cree citas sin colisiones
- .env tiene slots para `N8N_WEBHOOK_URL` y `N8N_API_KEY` (comentados)

### 22.2 Qué NO cambia cuando migras
- Frontend (Reservar, Mis Citas, Dashboard)
- Backend API (citas, auth, barberías)
- Firestore (estructura, reglas, índices)
- Security Rules
- Lógica de horarios, puntos, cancelaciones
- Dashboard Admin

### 22.3 Cuánto cuesta fase 2
- **n8n self-hosted**: $5-20 USD/mes (Railway) — gratuito en n8n.cloud (límites)
- **Costo adicional vs ManyChat**: ~$0-15 USD/mes
- **Tu decides cuándo vale la pena**

---

## 23. GESTIÓN DE SERVICIOS, PRECIOS, LOGO Y PUNTOS

### 23.1 Catálogo de servicios disponibles

> Cada barbería elige cuáles servicios ofrece. No todos los negocios tienen los mismos — el barbero activa o desactiva desde su panel.

```typescript
// src/types/servicios.ts

export const SERVICIOS_DISPONIBLES = [
  {
    id: 'corte_clasico',
    nombre: 'Corte clásico',
    descripcion: 'Corte tradicional con máquina y tijera',
    duracion_default: 30,
    precio_default: 120,
  },
  {
    id: 'barba',
    nombre: 'Barba',
    descripcion: 'Arreglo y perfilado de barba',
    duracion_default: 20,
    precio_default: 80,
  },
  {
    id: 'bigote',
    nombre: 'Bigote',
    descripcion: 'Diseño y limpieza de bigote',
    duracion_default: 10,
    precio_default: 40,
  },
  {
    id: 'afeitado_full',
    nombre: 'Afeitado full',
    descripcion: 'Afeitado completo con navaja y crema',
    duracion_default: 25,
    precio_default: 100,
  },
  {
    id: 'cuidado_facial',
    nombre: 'Cuidado facial',
    descripcion: 'Limpieza facial, hidratación y tratamiento',
    duracion_default: 40,
    precio_default: 150,
  },
] as const;

export type ServicioId = typeof SERVICIOS_DISPONIBLES[number]['id'];
```

### 23.2 Colección: `servicios_activos` (sub-colección de barberías)

Cada barbería guarda en Firestore qué servicios ofrece y sus precios personalizados:

```
barberias/{barberia_id}
  └── servicios_activos/{servicio_id}
       ├── id: string
       ├── nombre: string
       ├── descripcion: string
       ├── duracion_min: number
       ├── precio: number
       ├── activo: boolean
       ├── creado_en: timestamp
       └── actualizado_en: timestamp
```

### 23.3 Quién puede ajustar qué

| Acción | Super Admin | Admin Barbería | Barbero | Cliente |
|---|---|---|---|---|
| Ver catálogo de servicios | ✅ | ✅ | ✅ | ✅ (solo activos) |
| Activar/desactivar servicio | ✅ | ✅ | ❌ | ❌ |
| Ajustar precio | ✅ | ✅ | ❌ | ❌ |
| Ajustar duración | ✅ | ✅ | ❌ | ❌ |
| Ver ventas diarias propias | ✅ | ✅ | ✅ | ❌ |
| Editar logo de la barbería | ✅ | ✅ | ❌ | ❌ |
| Configurar puntos | ✅ | ✅ | ❌ | ❌ |

### 23.4 API endpoints para gestión de servicios

```
GET    /api/barberias/:id/servicios
PUT    /api/barberias/:id/servicios/:sid
POST   /api/barberias/:id/servicios
DELETE /api/barberias/:id/servicios/:sid
```

### 23.5 Pantalla de configuración de servicios (Admin)

```
/barberia/servicios

╔══════════════════════════════════════════════╗
║  SERVICIOS — El Estilo SLP               [Guardar] ║
╠══════════════════════════════════════════════╣
║ ✓ Corte clásico        $120 MXN  ─  30 min   ║
║ ✓ Barba                 $80 MXN  ─  20 min   ║
║ ✗ Bigote               $40 MXN  ─  10 min   ← inactivo
║ ✓ Afeitado full       $100 MXN  ─  25 min   ║
║ ✓ Cuidado facial      $150 MXN  ─  40 min   ║
╚══════════════════════════════════════════════╝
  ↑ Toggle    ↑ Precio    ↑ Duración
```

### 23.6 Upload de Logo por Barbería

El logo se guarda en **Firebase Storage**, URL en `barberias/{id}.logo`.

```
POST /api/barberias/:id/logo
  - Imagen: PNG/JPG, max 2MB, 500x500 recomendado
  - Storage: gs://barberapp.appspot.com/logos/{barberia_id}.png

Permisos:
  - Super Admin: cualquier barbería
  - Admin: solo su barbería
  - Barbero: NO puede cambiar logo
```

**Firebase Storage rule:**
```javascript
match /logos/{barberiaId} {
  allow write: if request.auth.token.role == 'superadmin'
    || (request.auth.token.role == 'admin'
        && request.auth.token.barberia_id == barberiaId);
  allow read: if true;
}
```

### 23.7 Sistema de Puntos por Visita

```typescript
// puntos = precio / 10 (1 punto por cada $10 MXN)
function calcularPuntos(precio: number): number {
  return Math.floor(precio / PUNTOS_POR_PESOS);
}

// Corte $120 → 12 pts
// Barba $80 → 8 pts
// Paquete $200 → 20 pts
```

**Tabla de canjes:**

| Puntos | Recompensa |
|---|---|
| 100 | Café/producto pequeño |
| 200 | Descuento 10% siguiente servicio |
| 500 | 1 corte clásico gratis |
| 1000 | Paquete completo gratis |

**Firestore — `usuarios/{uid}:**
```
puntos: number
puntos_historial: array [
  { fecha, puntos (+/-), motivo, cita_id }
]
```

### 23.8 Dashboard del Barbero — Ventas Diarias

```
/barbero/dashboard

╔═══════════════════════════════════════════╗
║  HOY — 3 Mayo 2026                        ║
╠═══════════════════════════════════════════╣
║ 10:00  Juan P.     Corte clásico   $120  ║
║ 10:30  Carlos M.    Barba            $80  ║
║ 11:30  Roberto L.   Afeitado full   $100  ║
╠═══════════════════════════════════════════╣
║ Total día:                      $300 MXN ║
╚═══════════════════════════════════════════╝

Cards: "Hoy — X citas" | "Ingresos hoy: $X" | "Esta semana: $X"
```

**Endpoints:**
```
GET /api/barbero/:barbero_id/ventas?fecha=2026-05-03
GET /api/barbero/:barbero_id/ventas?semana=2026-05
```

### 23.9 Puntos: API endpoints

```
GET  /api/clientes/:uid/puntos
POST /api/clientes/:uid/puntos/canjear
PUT  /api/barberias/:id/puntos/config
```

### 23.10 Panel de Configuración — Activar/Desactivar funciones

```
/barberia/config
├── Logo de la barbería (upload)
├── Datos del negocio (nombre, dirección, teléfono)
├── Servicios activos (toggles)
├── Horarios
├── Sistema de puntos: activar/desactivar, valor por peso
├── WhatsApp: activar/desactivar bot
├── Pagos: estado suscripción
└── Danger zone: cerrar barbería
```

**Campos en `barberias/{id}:**
```
config: map {
  puntos_activo: boolean,
  puntos_por_pesos: number,   // default: 10
  whatsapp_activo: boolean,
  reservas_activas: boolean,
}
```

---

> **NOTA FINAL:** Este documento contiene toda la especificación necesaria para construir BarberApp de principio a fin. Cada sección incluye la estructura de datos exacta, el código de referencia, las reglas de negocio, los mensajes de usuario y el flujo completo. Un agente de IA o desarrollador puede seguir este documento secuencialmente para producir la aplicación completa.

*Documento actualizado: Mayo 2026*
*Stack: Next.js 16.2 + React 19 + Tailwind 4 + Firebase 11 + TypeScript strict*
*Fase 2 prep: Arquitectura lista para migrar de ManyChat a n8n sin reescribir código*
*Manuel Alejandro Ramos Tejada*
