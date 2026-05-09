# Napkin Runbook — BarberApp

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-05-07] iPad race condition — peticiones API sobrescriben estado**
   Do instead: usar AbortController para cancelar peticiones pendientes antes de hacer nuevas. Ver admin/dashboard y barbero/dashboard.

2. **[2026-05-07] Firebase private key en Vercel pierde saltos de línea**
   Do instead: guardar como `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII..."` con \n escapados. El sistema en firebase-admin.ts tiene lógica de reconstrucción automática.

3. **[2026-05-07] Notificar cliente al confirmar cita — PATCH /api/barberias/[id]/citas**
   Do instead: al cambiar estado a "confirmada", escribir en Firestore `chats/{chatId}/messages` con `isSystem: true`. El ChatView ya usa onSnapshot — la notificación llega en tiempo real sin webhook adicional.

## Shell & Command Reliability
1. **[2026-05-07] git diff en rutas con espacios falla**
   Do instead: usar comillas вокруг rutas o cd con escape. Siempre usar `cd "/Users/macbook/Proyectos/..."`.

2. **[2026-05-07] Build local tarda 110s+ — usar Firebase Emulators para dev rápido**
   Do instead: correr `firebase emulators:start` + `npm run dev` local. No hacer build local durante desarrollo.

## Domain Behavior Guardrails
1. **[2026-05-07] Estados de cita: pendiente → confirmada → completada/en_curso/no_show/cancelada_***
   Do instead: no confiar en transiciones de estado implícitas. Validar flujo completo.

2. **[2026-05-07] Custom Claims controlan acceso — barberia_id es crítico**
   Do instead: toda API route debe verificar role Y barberia_id antes de retornar datos.

3. **[2026-05-07] Cliente final (usuario) no tiene barbero_id en sus claims**
   Do instead: al agendar, el barberoId se guarda en la cita, no en claims del usuario.

## Napkin Behavior (Claude Code)
- **Función**: Panel de errores en tiempo real + bloc de notas del proyecto
- **Dónde**: Icono 🧻 en el sidebar de Claude Code, parte inferior izquierda
- **Flujo**: Error en app → aparece en Napkin → investigar → guardar solución
- **Útil para**: No perder contexto cuando algo falla, tener historial de problemas

## User Directives
1. **[2026-05-07] Hacer commit separado por cada fix urgente**
   Do instead: git add + git commit solo los archivos del fix específico, mensaje claro del bug.
