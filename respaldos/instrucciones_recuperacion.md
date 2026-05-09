# Punto de Control - 06 de Mayo 2026

Este es un respaldo del estado actual del proyecto. El flujo de citas, notificaciones básicas y dashboards de administrador/barbero están implementados y funcionales.

## Cómo levantar el servicio desde este punto

1.  **Instalación de dependencias:**
    ```bash
    npm install
    ```

2.  **Configuración de variables de entorno:**
    Asegúrate de tener el archivo `.env.local` con las credenciales de Firebase:
    - `NEXT_PUBLIC_FIREBASE_API_KEY`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
    - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
    - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
    - `NEXT_PUBLIC_FIREBASE_APP_ID`
    - `FIREBASE_ADMIN_PROJECT_ID`
    - `FIREBASE_ADMIN_CLIENT_EMAIL`
    - `FIREBASE_ADMIN_PRIVATE_KEY`

3.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Acceso:**
    El sistema estará disponible en `http://localhost:3000`.

## Estado actual de funcionalidades

- **Flujo de Citas:** Los clientes pueden reservar servicios. Las citas se crean en estado `pendiente`.
- **Dashboard Admin:** Permite ver todas las citas de la barbería y confirmar las que están pendientes.
- **Dashboard Barbero:** Permite ver sus citas del día, confirmar pendientes, cancelar o finalizar citas completadas.
- **Notificaciones:** 
  - El cliente recibe notificación cuando su reserva es recibida (pendiente).
  - El barbero y admins reciben notificación cuando hay una nueva reserva.
  - El cliente recibe notificación cuando su cita es confirmada o cancelada por el admin/barbero.
- **Perfil Barbero:** Ahora muestra a qué barbería está ligado.

## Respaldo de Archivos Clave
Si algo deja de funcionar, revisa estos archivos:
- `src/lib/citas-server.ts`: Lógica central de citas y triggers de notificaciones.
- `src/lib/notifications-server.ts`: Envío de notificaciones (Push e In-App).
- `src/app/(dashboard)/admin/dashboard/page.tsx`: Dashboard administrativo.
- `src/app/(dashboard)/barbero/dashboard/page.tsx`: Dashboard del barbero.
- `src/hooks/useAuth.tsx`: Manejo de roles y datos del usuario.
