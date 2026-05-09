# Punto de Control - BarberApp

Este es un respaldo de las instrucciones y estado actual del servicio hasta el 6 de mayo de 2026.

## Estado Actual
- **Autenticación**: Funcionando con roles (SuperAdmin, Admin, Barbero, Cliente).
- **Mensajería**: Real-time con `onSnapshot` (Pendiente corregir error de permisos).
- **Reservas**: Flujo de reserva completado con validación de horarios.
- **Dashboard Barbero**: Vista de citas diarias y gestión de estados.

## Instrucciones para levantar el servicio
1. Instalar dependencias: `npm install`
2. Configurar variables de entorno en `.env.local` (Firebase config).
3. Iniciar el servidor de desarrollo: `npm run dev`
4. Las reglas de Firestore deben estar desplegadas: `firebase deploy --only firestore:rules`

## Próximos Pasos definidos por el usuario:
1. Asegurar que el barbero esté ligado correctamente a su barbería.
2. Implementar notificaciones para Admin/Barbero cuando se crea una cita.
3. Asegurar que el estado "Pendiente de Confirmación" sea claro para el cliente.
4. Botón de reinicio total en el panel de SuperAdmin (manteniendo usuarios).
