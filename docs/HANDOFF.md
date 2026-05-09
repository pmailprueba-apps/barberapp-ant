# BarberApp — Guía de Handoff y Capacitación

> Este documento es para cualquier desarrollador que deba continuar, mantener o expandir BarberApp.

---

## 1. Qué es BarberApp

Plataforma SaaS multi-tenant para barberías en San Luis Potosí. Un Super Admin vende/renta el servicio a múltiples barberías. Cada barbería tiene su propio espacio aislado.

**Stack:**
- Next.js 16.2 + React 19 + Tailwind CSS v4
- Firebase (Firestore + Auth + Storage)
- TypeScript strict
- GCP + Docker (deploy persistente)
- PWA con `@ducanh2912/next-pwa`

---

## 2. Arquitectura de datos

### Firestore — 2 patrones de colección

**Colecciones raíz:**
- `barberias` — documento por barbería
- `usuarios` — documento por usuario (uid de Firebase Auth)

**Sub-colecciones:**
- `barberias/{id}/servicios_activos` — servicios con toggle individual
- `barberias/{id}/citas` — citas de esa barbería

### Por qué sub-colecciones
- `servicios_activos`: permite hacer `updateDoc` individual sin reescribir todo el documento padre
- `citas`: aislar datos por barbería (seguridad + queries más rápidas)

### Horarios
Se almacenan en `barberia.horarios` con formato:
```typescript
{
  lunes: { abre: "09:00", cierra: "20:00", activo: true },
  martes: { abre: "09:00", cierra: "20:00", activo: true },
  // ...
  domingo: { abre: null, cierra: null, activo: false }
}
```
`diaSemana 0 = domingo`.

---

## 3. Roles y seguridad

### Custom Claims en JWT
```typescript
{ role: "superadmin" | "admin" | "barbero" | "cliente", barberia_id: "...", barbero_id: "..." }
```

### Reglas Firestore
- Super Admin: acceso total
- Admin: solo a su barbería (`barberia_id` en token == resource.data.barberia_id)
- Barbero: solo a citas/servicios de su barbería
- Cliente: solo a sus propias citas

### Firebase Admin — Importante
**Nunca importar `adminAuth`/`adminDb` en el top-level del módulo.** Usar lazy-load:

```typescript
// ✅ Correcto
export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin not configured");
  return getAuth(app);
}

// ❌ Incorrecto (falla el build sin credenciales)
import { adminAuth } from "@/lib/firebase-admin";
```

Todas las API routes que usan Firebase Admin deben llamar `getAdminAuth()` dentro del handler.

---

## 4. API Routes principales

### Barberías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/barberias` | Listar todas (superadmin) |
| POST | `/api/barberias` | Crear barbería |
| GET | `/api/barberias/[id]` | Detalle |
| PUT | `/api/barberias/[id]` | Actualizar |
| DELETE | `/api/barberias/[id]` | Eliminar |
| POST | `/api/barberias/[id]/logo` | Subir logo |
| GET | `/api/barberias/[id]/servicios` | Listar servicios activos |
| POST | `/api/barberias/[id]/servicios` | Agregar/inicializar servicios |
| PUT | `/api/barberias/[id]/servicios/[sid]` | Toggle activo / actualizar precio |
| GET | `/api/barberias/[id]/disponibilidad?fecha=YYYY-MM-DD` | Slots disponibles |
| GET | `/api/barberias/[id]/citas?fecha=YYYY-MM-DD` | Citas del día |
| POST | `/api/barberias/[id]/citas` | Crear cita (anti-doble-booking) |
| DELETE | `/api/barberias/[id]/citas?citaId=` | Cancelar cita |
| GET | `/api/barberias/[id]/stats` | Dashboard stats |
| GET | `/api/barberias/por-slug/[slug]` | Landing QR pública |

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/set-custom-claims` | Asignar role + barberia_id al usuario |
| GET | `/api/auth/me` | Devolver info del usuario desde token |

### Puntos y Mensajes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/puntos` | Obtener puntos del usuario |
| POST | `/api/puntos` | Canjear puntos |
| POST | `/api/mensajes` | Enviar WhatsApp (confirmación, recordatorio, campaña) |

### Webhooks
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/webhooks/whatsapp` | ManyChat webhook handler |

---

## 5. Motor de slots

`src/lib/slots.ts` — `generarSlotsBase(horario, duracionMin)` → array de `Slot{hora, disponible}`.

Flujo:
1. `generarSlotsBase(horario, 30)` — genera todos los slots de 30 min
2. `excluirOcupados(slots, citas)` — marca como no-disponibles los slots que overlap con citas existentes
3. `excluirDomingos(slots, diaSemana)` — si `diaSemana === 0`, todos los slots quedan no-disponibles

**Anti-doble-booking en `crearCita`:**
- Consulta citas del mismo día en la barbería
- Si existe una cita en el mismo horario (o que se solape), rechaza con 409

---

## 6. Sistema de puntos

- `PUNTOS_POR_PESOS = 10` en `src/lib/constants.ts`
- `acumularPuntos(uid, monto)` → `Math.floor(monto * 10)` puntos
- `canjearPuntos(uid, puntosRequeridos)` → valida que tenga puntos suficientes, descuenta con `increment(-puntos)`

---

## 7. WhatsApp

`src/lib/whatsapp.ts` — Abstraction layer con dos providers:

```typescript
WHATSAPP_PROVIDER=manychat  // fase 1
WHATSAPP_PROVIDER=n8n      // fase 2
```

Para cambiar de ManyChat a n8n: cambiar la variable de entorno, no hay que tocar código.

---

## 8. PWA

- Manifest: `/public/manifest.json`
- Iconos SVG: `/public/icons/icon-192x192.svg` y `icon-512x512.svg`
- Service Worker: generado por `@ducanh2912/next-pwa` en `public/sw.js`
- Solo activa en producción (`disable: process.env.NODE_ENV === "development"`)

---

## 9. Dashboard rutas

| Ruta | Rol | Descripción |
|---|---|---|
| `/admin/dashboard` | admin | Stats del día + citas |
| `/admin/qr` | admin | Generador de códigos QR |
| `/barbero/dashboard` | barbero | Mis citas del día + ventas |
| `/cliente` | cliente | (esqueleto — pendiente) |
| `/b/[slug]` | público | Landing pública QR |

---

## 10. Workflow para agregar features

1. `npm run build` debe pasar localmente antes de push
2. `npx tsc --noEmit` debe pasar sin errores
3. Todas las API routes que usan Firebase Admin → lazy-load con `getAdminAuth()`
4. Firestore rules para sub-colecciones (`/barberias/{id}/citas`, `/barberias/{id}/servicios_activos`)
5. Usar `formatPrecio` y `formatFecha` de `src/lib/utils.ts` — no hardcodear MXN

---

## 11. Variables de entorno obligatorias

```env
# Cliente (NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Admin
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY  # con \n literales
FIREBASE_ADMIN_STORAGE_BUCKET

# WhatsApp
WHATSAPP_PROVIDER=manychat
MANYCHAT_API_KEY
MANYCHAT_VERIFY_TOKEN

# App
NEXT_PUBLIC_APP_URL
```

---

## 12. Deploy

1. Push a `main` en GitHub
2. El servidor GCP descarga los cambios vía `git pull` (o mediante un pipeline de CI/CD)
3. Re-build del contenedor: `docker compose up -d --build`

**Guía Detallada de GCP:** [DEPLOY_GCP.md](./DEPLOY_GCP.md)

Repo: https://github.com/pmailprueba-apps/barberapp-ant

---

## 13. Pendientes (no implementados)

- Dashboard Cliente (`/cliente/page.tsx` — es esqueleto)
- Dashboard Super Admin
- Notificaciones push PWA (Firebase Cloud Messaging)
- Calificaciones y reviews
- Promociones y descuentos
- n8n Phase 2 (migración desde ManyChat)
- Cloud Functions para pagos y recordatorios automáticos

---

## 14. Archivos clave

| Archivo | Propósito |
|---|---|
| `src/hooks/useAuth.tsx` | AuthContext — todo el estado de autenticación |
| `src/middleware.ts` | Protección de rutas por rol |
| `src/lib/firebase-admin.ts` | Admin SDK (lazy-load) |
| `src/lib/barberias.ts` | CRUD barberías |
| `src/lib/servicios.ts` | CRUD servicios_activos |
| `src/lib/citas.ts` | CRUD citas + anti-doble-booking |
| `src/lib/slots.ts` | Motor de slots |
| `src/lib/whatsapp.ts` | Abstraction WhatsApp |
| `src/types/firebase.ts` | Interfaces TypeScript |
| `src/types/roles.ts` | Roles + helpers |
| `docs/DEPLOY_GCP.md` | Guía de deploy en Google Cloud |
| `docs/DEPLOY_VERCEL.md` | Guía antigua (Vercel) |

---

## 15. Emergencies

**Build falla en el servidor:**
→ Verificar logs de Docker: `docker logs <container_id>`
→ Verificar que `.env.local` tenga las variables correctas.

**API 500 error:**
→ Revisar que todas las env vars estén configuradas en el servidor.
→ Ver logs: `docker logs barberapp`

**Firebase Auth no funciona:**
→ Verificar `NEXT_PUBLIC_FIREBASE_*` en el archivo `.env.local` del servidor.

**PWA no instala:**
→ Verificar que `NEXT_PUBLIC_APP_URL` coincida con el dominio de Vercel
→ El service worker solo funciona en producción, no en `localhost`