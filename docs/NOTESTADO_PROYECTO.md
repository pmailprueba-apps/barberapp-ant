# BarberApp - Estado del Proyecto y Progreso (Mayo 2026)

## Resumen Ejecutivo

BarberApp es una plataforma SaaS multi-tenant para gestión de barberías, construida con Next.js 16.2 + React 19 + Tailwind CSS v4 + Firebase (Firestore + Auth + Storage).

**Porcentaje de avance estimado: ~70-75%** (Fase 1 y 2 casi completas, Fase 3 y 4 pendientes)

---

## 1. ESTRUCTURA GENERAL DEL PROYECTO

```
barberapp/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, registro, selector de rol
│   │   ├── (dashboard)/         # Rutas protegidas por rol
│   │   │   ├── admin/          # Dashboard dueno de barberia
│   │   │   ├── barbero/        # Dashboard empleado
│   │   │   ├── superadmin/     # Panel plataforma completa
│   │   │   └── usuario/        # Dashboard cliente final
│   │   ├── api/                # API Routes (Firebase Admin SDK)
│   │   └── b/[slug]/           # Landing publica barberia (QR)
│   ├── components/
│   │   ├── ui/                 # Button, RoleGate, ServiceCard, PuntosBadge
│   │   └── layouts/            # Sidebar
│   ├── hooks/                  # useAuth.tsx (Firebase Auth Context)
│   ├── lib/                    # firebase, citas, puntos, slots, whatsapp
│   ├── services/               # barberiaService, userService, pagoService
│   └── types/                  # Definicion de roles y tipos Firebase
├── docs/                       # Documentacion
└── public/                     # Assets, manifest.json (PWA)
```

---

## 2. FUNCIONALIDADES IMPLEMENTADAS

### Autenticacion y Roles (COMPLETO)
- Login email/password + Google Sign-In
- Firebase Auth Custom Claims: superadmin, admin, barbero, usuario
- Redireccion automatica por rol post-login
- Middleware de proteccion de rutas
- Selector de rol /seleccionar-rol

### Superadmin Dashboard (COMPLETO)
- Metricas (barberias activas, ingresos, citas)
- Gestion de barberias (crear, editar, suspender)
- Gestion de usuarios
- Logs del sistema
- Pagos y suscripciones

### Admin Dashboard (COMPLETO)
- Dashboard con citas del dia, ingresos, clientes, barberos
- Configuracion de barberia (nombre, direccion, horarios, TikTok/Facebook)
- Gestion de barberos (alta/baja)
- Gestion de servicios (precios, duracion)
- Configuracion de horarios por dia
- Generacion de codigos QR
- Pagina de metricas

### Barbero Dashboard (COMPLETO)
- Dashboard personal con citas del dia
- Vista de ventas diarias
- Marcar citas como completadas

### Usuario/Cliente Dashboard (PARCIAL)
- Reserva de citas (UI basica, dice "proximamente")
- Vista de codigo QR personal
- Puntos acumulados (sistema de lealtad)

### Sistema de Reservas (COMPLETO)
- Anti-doble-booking (verificacion de horarios)
- 5 servicios fijos: Corte, Barba, Bigote, Afeitado, Facial
- Cancelacion con validacion de 1 hora previa
- Calificacion de citas (1-5 estrellas + comentario)
- Sistema de puntos: 1 punto por cada $10 MXN

### Landing Publica /b/[slug] (COMPLETO)
- Info de barberia (nombre, logo, horarios, direccion)
- Boton llamar directamente
- Boton WhatsApp con mensaje preconfigurado
- Boton "Reservar en linea" (redirige a login)
- Detecta dia actual y marca "Hoy"

### WhatsApp Bot (EN DESARROLLO)
- Webhook /api/webhooks/whatsapp existe
- Flujo de bienvenida->reserva esta en desarrollo (ManyChat -> n8n migracion pendiente)

### PWA (CONFIGURADO)
- manifest.json configurado
- Icons y service worker pueden necesitar refinamiento

### Integracion n8n (PENDIENTE)
- Webhook /api/webhooks/n8n preparado
- Migracion de ManyChat a n8n aun no ejecutada

---

## 3. STACK TECNOLOGICO

- Frontend: Next.js 16.2 + React 19 + Tailwind CSS v4
- Backend: Firebase (Firestore + Auth + Storage) + Admin SDK
- Auth: Firebase Auth con Custom Claims
- PWA: @ducanh2912/next-pwa
- QR: qrcode.react
- Push: FCM (Firebase Cloud Messaging)
- Notificaciones: node-cron (servidor) + FCM
- Deploy: Vercel

---

## 4. PLAN DE DESARROLLO (BARBERAPP_PLAN_v2.md)

### Fase 1: Fundamentos y Auth - COMPLETO
### Fase 2: Core Features - COMPLETO
### Fase 3: Testing y Deploy - PENDIENTE
### Fase 4: Automatizaciones (n8n, WhatsApp) - PENDIENTE

---

## 5. NOTAS IMPORTANTES

- El rol superadmin solo esta habilitado para pmailprueba@gmail.com
- Hay un sistema de log centralizado en /api/log
- Firestore rules configuradas para seguridad
- La variable FIREBASE_PRIVATE_KEY tiene logica especial de limpieza para Vercel
- Proyecto activo con commits recientes de Mayo 2026
- Ultimos cambios: correccion de rutas admin, campos TikTok/Facebook en config

---

*Documento generado automaticamente para NotebookLM BarberApp - Mayo 2026*