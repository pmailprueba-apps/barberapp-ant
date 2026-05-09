# Cuentas de Prueba para BarberApp

Este documento contiene las credenciales de las cuentas de prueba configuradas en el entorno local (y Staging) para probar los diferentes roles de la aplicación de manera rápida. 

Todas estas cuentas tienen los permisos ("Custom Claims") configurados a nivel de Firebase Authentication y registros creados en Firestore en la colección `empleados`/`users`.

## 🛡️ Super Administrador
Tiene acceso a todas las métricas globales, a la creación de nuevas barberías y visualización total del sistema.
* **Email:** `superadmin@prueba.com`
* **Contraseña:** `Prueba123!`
* **Redirección esperada:** `/superadmin/...`

## 💈 Admin (Dueño de Barbería)
Tiene acceso al panel de su propia barbería (ej. `barberia_prueba_01`). Puede ver ganancias, añadir barberos y gestionar servicios.
* **Email:** `admin@prueba.com`
* **Contraseña:** `Prueba123!`
* **Redirección esperada:** `/admin/dashboard` o `/seleccionar-rol` (si tiene rol doble)

## ✂️ Barbero
Tiene acceso únicamente a su agenda, los cortes que tiene programados y sus propias comisiones.
* **Email:** `barbero@prueba.com`
* **Contraseña:** `Prueba123!`
* **Redirección esperada:** `/barbero/dashboard` o `/seleccionar-rol`

## 📱 Cliente (Usuario Final)
Es la persona que agenda una cita. Tiene acceso al mapa de barberías, reservas, perfil y puntos de lealtad.
* **Email:** `cliente@prueba.com`
* **Contraseña:** `Prueba123!`
* **Redirección esperada:** `/dashboard` o `/cliente/...`

---
> **Tip de Desarrollo:** Mientras estés corriendo la aplicación en modo desarrollo (`npm run dev`), no necesitas escribir estas credenciales. Solo haz clic en el botón flotante de **Dev Tools (🛠️)** en la esquina inferior izquierda de la pantalla y el inicio de sesión se hará en 1 clic.
