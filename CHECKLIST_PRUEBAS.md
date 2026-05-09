# 📋 Lista de Control: Validación de BarberApp

## 0. Estabilidad del Sistema (Arreglos Recientes)
- [ ] **Navegación Cliente:** Entrar a "Mis Citas" y "Mi Perfil" desde el panel de usuario y verificar que NO den error 404.
- [ ] **Carga del Chat:** Entrar al chat y verificar que cargue la interfaz correctamente (se eliminó código duplicado que podía causar fallos).
- [ ] **Permisos de Firestore:** Verificar que ya no aparezca el error "Missing or insufficient permissions" en la consola del navegador al usar el chat.
- [ ] **Reserva (Establecimiento Fijo):** Entrar a "Reservar Cita" y verificar que ya aparezca el nombre de tu barbería por defecto sin tener que elegirla.
- [ ] **Reserva (Servicios y Barberos):** Verificar que ya puedes seleccionar un servicio y un barbero de la lista real (se marcan en dorado).

## 1. Seguridad y Acceso (Bloqueo)
- [ ] **Acceso Admin Pendiente:** Crear un Admin nuevo y verificar que el dashboard le muestre "Cuenta Pendiente".
- [ ] **Acceso Barbero Pendiente:** Lo mismo para un Barbero nuevo; debe estar bloqueado hasta ser asignado.
- [ ] **Desbloqueo:** Verificar que una vez asignada la barbería por el Super Admin, el usuario pueda entrar.

## 2. Mensajería (Permisos y Filtros)
- [ ] **Pestañas por Rol:** Verificar que aparezcan las pestañas correctas (Admins, Barberos, Clientes) al entrar a mensajería.
- [ ] **Permisos de Envío:**
    - [ ] **Super Admin:** ¿Puede escribirle a los Admins?
    - [ ] **Admin:** ¿Puede escribirle a Super Admin, Barberos y Clientes?
    - [ ] **Barbero:** ¿Puede escribirle a Admin y Clientes?
    - [ ] **Cliente:** ¿Puede escribirle a Admin y Barberos?
- [ ] **Privacidad:** Confirmar que un Cliente **NO** puede ver ni escribirle a otros Clientes.

## 3. Mensajería (Interfaz y Avisos)
- [ ] **Vista Previa:** ¿Se ve el último mensaje y quién lo envió en la lista lateral?
- [ ] **Punto Rojo de Aviso:** Enviar un mensaje y verificar que aparezca el punto rojo de notificación en el contacto.
- [ ] **Hora:** ¿Se muestra la hora del último mensaje correctamente?

## 4. Sistema de Puntos (500 pts)
- [ ] **Suma Automática:** Al marcar una cita como "Completada" (desde el perfil de Barbero), ¿se suman los puntos al Cliente?
- [ ] **Barra de Progreso:** En el panel del Cliente, ¿se ve la barra moviéndose hacia la meta de los 500 puntos?
- [ ] **Efecto Visual:** ¿Se ve el efecto de resplandor (glow) en la tarjeta de puntos?

### 5. Gestión de Citas (Barbero)
- [ ] Recordatorios: Notificación a los 60 y 30 minutos antes de la cita.
- [ ] Flujo de Atención: Botón "Comenzar" bloquea otras citas y marca "En Curso".
- [ ] No Llegó: Opción de marcar "No llegó" para liberar el estado y avanzar.
- [ ] Finalización: Registro de notas técnicas en `notas_barbero`.
- [ ] Adelantar Citas: Lógica para atender citas futuras si se termina antes.
- [ ] Control de Retrasos: Detección de exceso de tiempo con aviso al cliente.
- [ ] Notificación Retraso: Botón para avisar al siguiente cliente si hay demora.

### 6. Validación de Personal (Admin)
- [ ] Solicitudes: Aparición de nuevos barberos en la sección de pendientes.
- [ ] Aprobación: El barbero gana acceso al dashboard tras ser validado.
- [ ] Baja: El admin puede quitar a un barbero, regresándolo a rol de usuario.
- [ ] Perfil Barbero: El barbero puede editar su nombre, teléfono y foto.

### 7. Integraciones Futuras (Fase Producción)
- [ ] **Notificaciones Push/WhatsApp:** Conexión de la lógica de `handleNotificarRetraso` y recordatorios con servicio externo (n8n, Twilio o WhatsApp Business API). *Nota: Implementar una vez la app esté desplegada.*
