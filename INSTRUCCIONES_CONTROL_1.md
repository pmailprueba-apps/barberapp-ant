# PUNTO DE CONTROL 1: Ambiente de Pruebas Restaurado
Fecha: 6 de Mayo, 2026

Este punto de control representa el estado funcional de la aplicación con acceso desde red local y herramientas de desarrollo activas.

## 🚀 Cómo Levantar el Servicio

1. **Terminal**: Asegúrate de estar en la carpeta raíz del proyecto:
   `/Users/macbook/Proyectos/BLENDER ANT/PROYECTOS/09-barberias/barberapp`
2. **Comando**: Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. **Acceso Local**: Desde la computadora, abre:
   `http://localhost:3000`
4. **Acceso Red Local (Celular)**: Usa la IP configurada:
   `http://192.168.100.3:3000`

## 🛠️ Herramientas de Desarrollo
- **Lado Derecho (Botón Púrpura "🛠️ Usuarios")**: Permite cambiar entre roles (Super Admin, Admin, Barbero, Cliente) sin tener que cerrar sesión manualmente.
- **Lado Izquierdo (Overlay Next.js)**: Muestra errores en tiempo real y problemas de compilación.

## ⚠️ Configuraciones Críticas (Mantenidas en este Respaldo)
1. **next.config.ts**: Contiene `allowedDevOrigins: ["192.168.100.3"]`. Si tu IP cambia, debes actualizarla aquí para que el CSS cargue en el celular.
2. **src/lib/fcm.ts**: Tiene la protección contra el error `navigator.serviceWorker` en conexiones no seguras (HTTP).
3. **src/components/dev-tools.tsx**: Usa estilos inline para garantizar visibilidad total.

## 📋 Cuentas de Prueba (Configuradas en DevTools)
- **Super Admin**: superadmin@prueba.com / Prueba123!
- **Admin**: admin@prueba.com / Prueba123!
- **Barbero**: barbero@prueba.com / Prueba123!
- **Cliente**: cliente@prueba.com / Prueba123!
