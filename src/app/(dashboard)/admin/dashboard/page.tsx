"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatFecha, formatHora, formatPrecio } from "@/lib/utils";
import { X, Calendar, User, Scissors, Clock, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CitaService } from "@/services/citaService";
import { CancelModal } from "@/components/ui/cancel-modal";
import { ConfirmCancelModal } from "@/components/ui/confirm-cancel-modal";

interface Stats {
  citasHoy: number;
  ingresosHoy: number;
  clientesActivos: number;
  barberosActivos: number;
}

interface CitaResumen {
  id: string;
  cliente_nombre: string;
  barbero_nombre: string;
  servicio_nombre: string;
  fecha: string;
  hora: string;
  estado: string;
  precio: number;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ citasHoy: 0, ingresosHoy: 0, clientesActivos: 0, barberosActivos: 0 });
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [citasPendientes, setCitasPendientes] = useState<CitaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<CitaResumen | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (!user.barberia_id) {
      setLoading(false);
      return;
    }

    cargarDashboard();
  }, [user, authLoading]);

  const cargarDashboard = async () => {
    if (!user?.barberia_id) return;
    
    try {
      const hoy = new Date().toLocaleDateString('sv-SE');
      const token = await user.getIdToken();
      const headers = { "Authorization": `Bearer ${token}` };
      
      const [misCitas, statsRes, misPendientes] = await Promise.all([
        CitaService.getByBarberia(user.barberia_id, { fecha: hoy }, token),
        fetch(`/api/barberias/${user.barberia_id}/stats?fecha=${hoy}`, { headers }),
        CitaService.getByBarberia(user.barberia_id, { estado: "pendiente" }, token),
      ]);

      setCitas(misCitas);
      setCitasPendientes(misPendientes);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (e: any) {
      console.error("Error cargarDashboard:", e);
      toast.error("Error de conexión al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarCita = async (citaId: string) => {
    toast.loading("Confirmando cita...", { id: "confirmar-cita" });
    try {
      const token = await user?.getIdToken();
      await CitaService.updateEstado(user!.barberia_id!, citaId, "confirmada", {}, token);

      toast.success("Cita confirmada", { id: "confirmar-cita" });
      cargarDashboard();
    } catch (error: any) {
      toast.error(error.message, { id: "confirmar-cita" });
    }
  };

  const openCancelModal = (cita: CitaResumen) => {
    setCitaToCancel(cita);
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!citaToCancel) return;

    toast.loading("Cancelando cita...", { id: "cancelar-cita" });
    try {
      const token = await user?.getIdToken();
      await CitaService.updateEstado(
        user!.barberia_id!, 
        citaToCancel.id, 
        "cancelada_admin", 
        { motivo: reason }, 
        token
      );

      toast.success("Cita cancelada correctamente", { id: "cancelar-cita" });
      setConfirmCancelOpen(false);
      setCitaToCancel(null);
      cargarDashboard();
    } catch (error: any) {
      toast.error(error.message, { id: "cancelar-cita" });
    }
  };

  const ESTADO_COLORS: Record<string, string> = {
    confirmada: "bg-[var(--teal)]",
    pendiente: "bg-[var(--gold)]",
    en_curso: "bg-[var(--blue)]",
    completada: "bg-[var(--green)]",
    cancelada_cliente: "bg-[var(--red)]",
    cancelada_admin: "bg-[var(--red)]",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Dashboard</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {formatFecha(new Date().toISOString())}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--muted)]">Bienvenido</p>
          <p className="font-bold text-[var(--gold)]">{user?.nombre || user?.email}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)]">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Citas hoy</p>
          <p className="text-2xl font-black text-[var(--white)] mt-1">{stats.citasHoy}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)]">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Ingresos hoy</p>
          <p className="text-2xl font-black text-[var(--gold)] mt-1">{formatPrecio(stats.ingresosHoy)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)]">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Clientes</p>
          <p className="text-2xl font-black text-[var(--white)] mt-1">{stats.clientesActivos}</p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)]">
          <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Barberos</p>
          <p className="text-2xl font-black text-[var(--white)] mt-1">{stats.barberosActivos}</p>
        </div>
      </div>

      {/* Pending Section - NEW */}
      {citasPendientes.length > 0 && (
        <div className="rounded-2xl bg-[var(--gold)]/5 border border-[var(--gold)]/20 overflow-hidden">
          <div className="p-4 bg-[var(--gold)]/10 flex items-center justify-between">
            <h2 className="font-bold text-[var(--gold)] flex items-center gap-2">
              <Clock size={18} />
              Pendientes de Confirmación
            </h2>
            <span className="bg-[var(--gold)] text-[var(--dark)] text-[10px] font-black px-2 py-0.5 rounded-full">
              {citasPendientes.length}
            </span>
          </div>
          <div className="divide-y divide-[var(--gold)]/10 max-h-[300px] overflow-y-auto">
            {citasPendientes.map((cita) => (
              <div key={cita.id} className="p-4 flex items-center gap-4 bg-[var(--gold)]/5">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--white)] truncate">{cita.cliente_nombre}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatFecha(cita.fecha)} - {cita.hora} | {cita.barbero_nombre}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfirmarCita(cita.id)}
                    className="w-10 h-10 rounded-full bg-[var(--teal)] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-[var(--teal)]/20"
                    title="Confirmar"
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => openCancelModal(cita)}
                    className="w-10 h-10 rounded-full bg-[var(--red)]/20 text-[var(--red)] flex items-center justify-center hover:bg-[var(--red)] hover:text-white hover:scale-110 active:scale-95 transition-all"
                    title="Rechazar"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointments of today */}
      <div className="rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] overflow-hidden">
        <div className="p-4 border-b border-[rgba(201,168,76,0.1)]">
          <h2 className="font-bold text-[var(--white)]">Citas de hoy</h2>
        </div>
        {citas.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(201,168,76,0.05)]">
            {citas.map((cita) => (
              <div key={cita.id} className="p-4 flex items-center gap-4 hover:bg-[var(--gold)]/5 transition-colors group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--gold)]">{cita.hora}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--white)] truncate">{cita.cliente_nombre}</p>
                  <p className="text-sm text-[var(--muted)]">{cita.servicio_nombre} • {cita.barbero_nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ESTADO_COLORS[cita.estado]?.replace("bg-", "text-") || "text-[var(--muted)]"}`}>
                    {cita.estado.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--gold)]">{formatPrecio(cita.precio)}</span>
                    <button
                      onClick={() => openCancelModal(cita)}
                      className="p-2 rounded-xl bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all"
                      title="Cancelar cita"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmCancelModal
        isOpen={confirmCancelOpen}
        onClose={() => {
          setConfirmCancelOpen(false);
          setCitaToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        nombreCliente={citaToCancel?.cliente_nombre}
        hora={citaToCancel ? `${formatFecha(citaToCancel.fecha)} - ${citaToCancel.hora}` : ""}
      />
    </div>
  );
}