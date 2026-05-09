# BarberApp — Plan de Desarrollo 22 Pasos

## Skills/Agentes Recomendados

| Categoría | Skills | Agentes |
|-----------|--------|---------|
| Texto natural | `humanizer` | `readme-agent`, `video-script-agent` |
| Browser testing | `agent-browser` | `e2e-testing-agent` |
| Auth/Firebase | — | `firebase-auth-expert`, `rbac-agent`, `firestore-rules-agent` |
| UI/Frontend | — | `admin-dashboard-agent`, `barber-dashboard-agent`, `client-dashboard-agent`, `calendar-ui-agent`, `charts-agent` |
| Lógica negocio | — | `scheduler-agent`, `transaction-agent`, `loyalty-engine-agent`, `points-dashboard-agent` |
| WhatsApp | — | `whatsapp-integration-agent`, `webhook-handler-agent`, `notification-agent`, `n8n-workflow-agent` |
| PWA/QR | — | `pwa-expert-agent`, `qr-system-agent`, `deeplink-agent` |
| Deploy | — | `vercel-deploy-agent`, `firebase-hosting-agent` |

---

## PASOS

### Fase 1: Fundamentos

**Paso 1** ✅ Completado: Next.js 16.2 + React 19 + Tailwind CSS v4
**Paso 2** ✅ Completado: Auth + Firebase Custom Claims + Layout Base

**Paso 3** ✅ Completado: Estructura de carpetas + TypeScript types

**Paso 4** ✅ Completado: Sistema de roles (4 roles)

**Paso 5** ✅ Completado: CRUD Barberías + **Candado de Seguridad**
- Acciones: Las barberías nuevas nacen en estado `pendiente`. Activación manual por SuperAdmin.

**Paso 6** — Gestión de servicios
- Skills: `service-catalog-agent` (agente), `toggle-ui-agent` (agente)
- Acciones: 5 servicios fijos (Corte, Barba, Bigote, Afeitado, Facial), UI con toggles

**Paso 7** — Motor de horarios/slots
- Skills: `scheduler-agent` (agente), `time-calculator-agent` (agente)
- Acciones: generarSlots(), excluir ocupados, excluir domingos

**Paso 8** — Crear/cancelar citas
- Skills: `transaction-agent` (agente), `calendar-ui-agent` (agente)
- Acciones: runTransaction anti-doble-booking, UI reservar, cancelar con validación 1h

**Paso 9** — Sistema de puntos
- Skills: `loyalty-engine-agent` (agente), `points-dashboard-agent` (agente)
- Acciones: 1pt/$10MXN, transacciones acumul/canje, UI puntos cliente

**Paso 10** ✅ Completado: Dashboard Admin Barbería
- Acciones: **Métricas de Negocio** (Ventas por día/mes/hora), Filtro por Barbero, QR generator.

**Paso 11** ✅ Completado: Dashboard Barbero
- Acciones: Agenda día, ventas diarias, **Botón Finalizar Corte** (actualiza métricas).

### Fase 2: WhatsApp + PWA

**Paso 12** — WhatsApp Bot (ManyChat Phase 1)
- Skills: `whatsapp-integration-agent` (agente), `webhook-handler-agent` (agente)
- Acciones: POST /api/webhooks/whatsapp, flow bienvenida→reserva

**Paso 13** — Mensajes automáticos
- Skills: `notification-agent` (agente), `cloud-functions-agent` (agente)
- Acciones: confirmar, recordatorio 1h, cancelar

**Paso 14** — PWA setup
- Skills: `pwa-expert-agent` (agente), `installability-agent` (agente)
- Acciones: @ducanh2912/next-pwa, manifest.json, icons, service worker

**Paso 15** — Sistema QR
- Skills: `qr-system-agent` (agente), `deeplink-agent` (agente)
- Acciones: QR por barbería, landing /b/[slug], imprimir

### Fase 3: Testing + Deploy

**Paso 16** — Testing con agent-browser
- Skills: `agent-browser` (skill), `e2e-testing-agent` (agente)
- Acciones: flujos completos e2e, screenshots

**Paso 17** — Deploy a Google Cloud (GCP) + Docker
- IP Externa: `34.172.114.2`
- Skills: `gcp-deploy-agent` (agente), `docker-expert-agent` (agente)
- Acciones: Configuración de instancia e2-micro, Docker Compose, SSL con Nginx Proxy Manager.

**Paso 18** — Documentación final
- Skills: `humanizer`, `readme-agent` (agente)
- Acciones: README.md, INSTRUCCIONES.md, variables .env

**Paso 19** — Capacitación + handoff
- Skills: `video-script-agent` (agente), `humanizer`
- Acciones: video tutorial, checklist primeros pasos

### Fase 4: Phase 2 Prep (n8n)

> ⚠️ **AVISO DE MIGRACIÓN — LEER ANTES DE PROCEDER**
>
> El paso de migración a **n8n** es una acción crítica que requiere **doble confirmación explícita** antes de ejecutar.
>
> **¿Por qué?**
> - La migración cambia el flujo completo de WhatsApp (ManyChat → n8n)
> - Cualquier error puede dejar el bot de WhatsApp fuera de servicio
> - Los webhooks activos en producción dejarán de funcionar si no se configura correctamente
>
> **Antes de proceder, verificar:**
> - ✅ Workflows de n8n probados en staging
> - ✅ Webhook URL de producción configurado en n8n
> - ✅ Backup de la configuración actual de ManyChat
> - ✅ Plan de rollback si la migración falla
>
> **Para confirmar la migración, el usuario debe escribir:**
> `"CONFIRMO MIGRACIÓN A n8n"` — cualquier otra respuesta será rechazada.

**Paso 20** — Phase 2 prep (n8n)
- Skills: `n8n-workflow-agent` (agente), `migration-agent` (agente)
- Acciones: IWhatsAppProvider listo, workflows n8n, indicadores volumen


### Fase 5: Escalamiento (Premium)
**Paso 21** — Soporte Multi-Sucursal
- Acciones: Selector de establecimiento para clientes, métricas consolidadas por sucursal, gestión de inventario compartido para dueños de múltiples locales.

---

## Proyecto Base
- Ubicación: `/Users/macbook/Documents/BLENDER ANT/barberapp`
- Firebase: `barberapp-ant-2026`
- Stack: Next.js 16.2 + React 19 + Tailwind CSS v4 + Firebase 11 + TypeScript strict
- Spec: `/Users/macbook/Documents/BLENDER ANT/PROYECTOS/09-barberias/BARBERAPP_SPEC.md`
