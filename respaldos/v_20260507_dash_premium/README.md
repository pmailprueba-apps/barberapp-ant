# 💈 BarberApp — Gestión Premium de Barberías

BarberApp es una plataforma SaaS de alto rendimiento diseñada para modernizar la gestión de barberías, automatizar reservas y proporcionar análisis de negocio detallados.

## 🚀 Funcionalidades Principales

### 🛡️ Seguridad y Control (Candado de Seguridad)
- **Sistema de Activación:** Las nuevas barberías inician en estado `pendiente`.
- **Aprobación Manual:** Solo el SuperAdmin puede activar cuentas tras verificar la información.
- **Acceso Restringido:** Dashboards bloqueados automáticamente para cuentas no aprobadas.

### 📈 Business Intelligence (Métricas)
- **Ventas en Tiempo Real:** Visualización por Día, Mes y Hora.
- **Filtros Avanzados:** Análisis de rendimiento individual por barbero.
- **Kpis Clave:** Ticket promedio, total de ventas y volumen de citas.

### ✂️ Operación Eficiente
- **Dashboard del Barbero:** Gestión de agenda diaria y botón de "Finalizar Corte" para actualización instantánea de métricas.
- **Gestión de Usuarios:** Reset de contraseñas administrativo desde el panel de SuperAdmin.
- **Multi-Rol:** Flujos personalizados para SuperAdmin, Admin, Barbero y Cliente.

## 🛠️ Stack Tecnológico
- **Frontend:** Next.js 15+ (App Router), React 19.
- **Estilos:** CSS puro con variables dinámicas (Gold & Dark Aesthetic).
- **Backend/Base de Datos:** Firebase (Firestore, Auth, Storage).
- **Iconografía:** Lucide React.

## 📦 Instalación y Desarrollo

1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env.local`.
4. Iniciar servidor local: `npm run dev`

---
*Desarrollado con precisión por Antigravity AI.*
