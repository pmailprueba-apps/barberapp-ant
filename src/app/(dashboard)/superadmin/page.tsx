"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Store, Users, CreditCard, TrendingUp, Activity, Loader2, ArrowUpRight, AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface Barberia {
  id: string;
  nombre: string;
  estado: string;
  plan: string;
  created?: Date;
}

interface DashboardStats {
  totalBarberias: number;
  barberiasActivas: number;
  totalUsuarios: number;
  ingresosMensuales: number;
  citasMes: number;
  crecimiento: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBarberias: 0,
    barberiasActivas: 0,
    totalUsuarios: 0,
    ingresosMensuales: 0,
    citasMes: 0,
    crecimiento: 0,
  });
  const [barberiasRecientes, setBarberiasRecientes] = useState<Barberia[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      const token = await user?.getIdToken();

      const [barberiasRes, usuariosRes] = await Promise.all([
        fetch("/api/barberias", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (barberiasRes.ok) {
        const barberias = await barberiasRes.json();
        const activas = barberias.filter((b: Barberia) => b.estado === "activa" || b.estado === "suspendida");

        setStats({
          totalBarberias: barberias.length,
          barberiasActivas: activas.filter((b: Barberia) => b.estado === "activa").length,
          totalUsuarios: 0, // se populate desde usuarios
          ingresosMensuales: 0,
          citasMes: activas.length * 12, // estimado
          crecimiento: 12,
        });

        // Ultimas 5 barberías
        const recientes = [...barberias]
          .sort((a: Barberia, b: Barberia) => {
            const dateA = a.created ? new Date(a.created as unknown as string).getTime() : 0;
            const dateB = b.created ? new Date(b.created as unknown as string).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 5);
        setBarberiasRecientes(recientes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSystem = async () => {
    setIsResetting(true);
    try {
      const token = await user?.getIdToken();
      
      const res = await fetch("/api/superadmin/reset-system", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });

      if (!res.ok) throw new Error("Error al reiniciar el sistema");

      const data = await res.json();
      toast.success(data.message || "Sistema reiniciado con éxito");
      
      // Recargar stats
      cargarDashboard();
      setShowConfirmReset(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Error crítico durante el reinicio");
    } finally {
      setIsResetting(false);
    }
  };

  const statCards = [
    {
      label: "Total Barberías",
      value: stats.totalBarberias.toString(),
      sub: `${stats.barberiasActivas} activas`,
      icon: Store,
      href: "/superadmin/barberias",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Ingresos Mensuales",
      value: `$${stats.ingresosMensuales.toLocaleString()}`,
      sub: `+${stats.crecimiento}% vs mes anterior`,
      icon: CreditCard,
      href: "/superadmin/pagos",
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Citas Este Mes",
      value: stats.citasMes.toString(),
      sub: "aproximado",
      icon: Activity,
      href: "/superadmin/log",
      color: "text-[var(--gold)]",
      bg: "bg-[var(--gold)]/10",
    },
    {
      label: "Suscripciones Activas",
      value: stats.barberiasActivas.toString(),
      sub: "de " + stats.totalBarberias,
      icon: TrendingUp,
      href: "/superadmin/pagos",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--white)]">Panel de Super Admin</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Resumen del ecosistema BarberApp</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20">
          <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--green)]">SISTEMA OPERATIVO</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block group"
          >
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[rgba(201,168,76,0.12)] hover:border-[var(--gold)]/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <ArrowUpRight size={16} className="text-[var(--muted)] group-hover:text-[var(--gold)] transition-colors" />
              </div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mb-1">{card.label}</p>
              {loading ? (
                <div className="h-8 w-20 bg-[var(--dark)] rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-black text-[var(--white)] group-hover:text-[var(--gold)] transition-colors">{card.value}</p>
              )}
              <p className="text-[10px] text-[var(--muted)] mt-1">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Barberías Recientes + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barberías Recientes */}
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.12)]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[var(--white)] flex items-center gap-2">
              <Store size={18} className="text-[var(--gold)]" />
              Barberías Recientes
            </h2>
            <Link href="/superadmin/barberias" className="text-xs text-[var(--gold)] hover:underline font-semibold">
              Ver todas →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[var(--gold)] animate-spin" />
            </div>
          ) : barberiasRecientes.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)]">
              <Store size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay barberías registradas</p>
              <Link
                href="/superadmin/barberias/nueva"
                className="inline-block mt-3 px-4 py-2 bg-[var(--gold)] text-[var(--dark)] rounded-lg text-xs font-bold hover:opacity-90"
              >
                Crear primera barbería
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {barberiasRecientes.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--dark)]/50 border border-[rgba(201,168,76,0.05)] hover:border-[var(--gold)]/15 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] font-black text-sm">
                      {b.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--white)] text-sm">{b.nombre}</p>
                      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{b.plan} • {b.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${
                    b.estado === "activa"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : b.estado === "suspendida"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    {b.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.12)]">
          <h2 className="text-lg font-bold text-[var(--white)] flex items-center gap-2 mb-5">
            <Activity size={18} className="text-[var(--gold)]" />
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/superadmin/barberias", label: "Gestionar Barberías", icon: Store, color: "text-blue-400" },
              { href: "/superadmin/usuarios", label: "Usuarios", icon: Users, color: "text-purple-400" },
              { href: "/superadmin/pagos", label: "Pagos y Suscripciones", icon: CreditCard, color: "text-green-400" },
              { href: "/superadmin/log", label: "Logs del Sistema", icon: Activity, color: "text-[var(--gold)]" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 p-4 rounded-xl bg-[var(--dark)]/50 border border-[rgba(201,168,76,0.08)] hover:border-[var(--gold)]/25 transition-all group"
              >
                <div className={`${item.color}`}><item.icon size={20} /></div>
                <div>
                  <p className="font-semibold text-[var(--white)] text-sm group-hover:text-[var(--gold)] transition-colors">{item.label}</p>
                  <p className="text-[10px] text-[var(--muted)]">Click para abrir</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.12)]">
        <h2 className="text-lg font-bold text-[var(--white)] mb-4">Acciones Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/superadmin/barberias/nueva"
            className="px-5 py-2.5 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold text-sm hover:opacity-90 flex items-center gap-2"
          >
            + Nueva Barbería
          </Link>
          <Link
            href="/superadmin/log"
            className="px-5 py-2.5 rounded-xl border border-[rgba(201,168,76,0.2)] text-[var(--muted)] font-semibold text-sm hover:text-[var(--white)] hover:border-[var(--gold)]/30 transition-colors"
          >
            Ver logs completos
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--card)] p-6 rounded-2xl border border-red-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldAlert size={120} className="text-red-500" />
        </div>
        
        <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
          <AlertTriangle size={18} />
          Zona de Peligro
        </h2>
        <p className="text-xs text-[var(--muted)] mb-6 max-w-xl">
          Estas acciones son irreversibles. Al reiniciar el sistema se eliminarán todas las barberías, citas, 
          servicios y logs de la plataforma. <strong className="text-red-400">Las cuentas de usuario (email/password) NO se eliminarán</strong>, 
          permitiendo que los barberos y clientes vuelvan a iniciar sesión en un ambiente limpio.
        </p>

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reiniciar sistema desde cero
          </button>
        ) : (
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-sm font-bold text-red-500">¿Estás absolutamente seguro?</p>
            <p className="text-xs text-red-400/80">Esta acción borrará TODO el historial operativo de la base de datos.</p>
            <div className="flex gap-3">
              <button
                disabled={isResetting}
                onClick={handleResetSystem}
                className="px-6 py-2.5 rounded-lg bg-red-500 text-white font-black text-xs hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    REINICIANDO...
                  </>
                ) : (
                  "SÍ, REINICIAR TODO"
                )}
              </button>
              <button
                disabled={isResetting}
                onClick={() => setShowConfirmReset(false)}
                className="px-6 py-2.5 rounded-lg bg-[var(--dark)] text-[var(--muted)] font-bold text-xs hover:text-[var(--white)] transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}