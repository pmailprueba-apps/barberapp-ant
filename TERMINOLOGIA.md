# BarberApp — Terminología y Roles

## Roles del sistema

| Código | Label | Descripción |
|--------|-------|-------------|
| `usuario` | Usuario | Persona que se corta el cabello (cliente final) |
| `cliente` | Cliente | Barbería (negocio que usa la plataforma) |
| `barbero` | Barbero | Empleado de una barbería |
| `admin` | Admin | Dueño de una barbería |
| `superadmin` | Super Admin | Administrador de toda la plataforma (pmailprueba@gmail.com) |

## Jerarquía

```
superadmin
  └── admin (dueño de barbería)
        └── barbero (empleado)
              └── usuario (persona que se corta)
```

## Flujo de autenticación

1. Usuario entra con email/password o Google
2. Después del login → `/seleccionar-rol`
3. Selecciona su rol → se asignan custom claims en Firebase Auth
4. Redirección según rol:
   - `superadmin` → `/superadmin`
   - `admin` → `/admin`
   - `barbero` → `/barbero`
   - `usuario` → `/usuario`

## Archivos clave

- `src/app/(auth)/seleccionar-rol/page.tsx` — Selector de rol
- `src/types/roles.ts` — Definición de tipos y constantes
- `src/components/ui/role-gate.tsx` — Protección de rutas por rol
- `src/hooks/useAuth.tsx` — Context de autenticación

## Notas

- Los roles se almacenan como **Firebase Auth Custom Claims**
- Un usuario puede tener un solo rol activo
- Para cambiar rol: logout → login → seleccionar otro rol
- El superadmin solo está habilitado para pmailprueba@gmail.com
