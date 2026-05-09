"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Role, ROLES } from "@/types/roles";
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  Clock, 
  QrCode, 
  TrendingUp, 
  Settings, 
  LogOut,
  Calendar,
  Gift,
  User,
  ShoppingBag,
  MessageSquare
} from "lucide-react";

const NAV_ITEMS: Record<string, { label: string; href: string; icon: any }[]> = {
  superadmin: [
    { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
    { label: "Barberías", href: "/superadmin/barberias", icon: Scissors },
    { label: "Usuarios", href: "/superadmin/usuarios", icon: Users },
    { label: "Mensajería", href: "/superadmin/mensajeria", icon: MessageSquare },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Barberos", href: "/admin/barberos", icon: Scissors },
    { label: "Clientes", href: "/admin/clientes", icon: Users },
    { label: "Servicios", href: "/admin/servicios", icon: ShoppingBag },
    { label: "Horarios", href: "/admin/horarios", icon: Clock },
    { label: "QR", href: "/admin/qr", icon: QrCode },
    { label: "Métricas", href: "/admin/metricas", icon: TrendingUp },
    { label: "Config", href: "/admin/config", icon: Settings },
    { label: "Mensajería", href: "/admin/mensajeria", icon: MessageSquare },
  ],
  barbero: [
    { label: "Dashboard", href: "/barbero/dashboard", icon: LayoutDashboard },
    { label: "Citas", href: "/barbero/citas", icon: Calendar },
    { label: "Perfil", href: "/barbero/perfil", icon: User },
    { label: "Mensajería", href: "/barbero/mensajeria", icon: MessageSquare },
  ],
  usuario: [
    { label: "Dashboard", href: "/usuario", icon: LayoutDashboard },
    { label: "Mis Citas", href: "/usuario/citas", icon: Calendar },
    { label: "Perfil", href: "/usuario/perfil", icon: User },
    { label: "Mensajería", href: "/usuario/mensajeria", icon: MessageSquare },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role || "usuario";
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.usuario;

  return (
    <aside className="w-64 min-h-screen bg-[var(--card)] border-r border-[rgba(201,168,76,0.18)] flex flex-col sticky top-0">
      <div className="p-6 border-b border-[rgba(201,168,76,0.18)]">
        <h1 className="text-2xl font-black gold-text-gradient tracking-tighter">BARBERAPP</h1>
        {user && (
          <div className="mt-2">
            <p className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-widest">{ROLES[role]}</p>
            {user.barberia_nombre && (
              <p className="text-[10px] text-[var(--gold)] font-bold uppercase mt-0.5 flex items-center gap-1">
                <Scissors className="w-2.5 h-2.5" />
                {user.barberia_nombre}
              </p>
            )}
            <p className="text-xs text-[var(--white)] truncate opacity-80 mt-1">{user.email}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-[var(--gold)] text-[var(--dark)] font-black shadow-lg shadow-[var(--gold)]/20"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--white)]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-[var(--dark)]" : "text-[var(--gold)] opacity-70 group-hover:opacity-100"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[rgba(201,168,76,0.18)]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 transition-all font-bold"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
