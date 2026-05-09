"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatFecha, formatPrecio } from "@/lib/utils";
import { Calendar, ChevronRight, History, Clock } from "lucide-react";
import Link from "next/link";

interface CitaCliente {
  id: string;
  barberia_id: string;
  barberia_nombre: string;
  barbero_nombre: string;
  servicio_nombre: string;
  fecha: string;
  hora: string;
  precio: number;
  duracion_min: number;
  estado: string;
  calificacion: number | null;
}

export default function MisCitasPage() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<CitaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"proximas" | "historial">("proximas");

  useEffect(() => {
    if (!user?.uid) return;
    cargarCitas();
  }, [user?.uid]);

  const cargarCitas = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/cliente/${user?.uid}/citas`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCitas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const citasProximas = citas.filter(
    (c) => c.estado === "confirmada" || c.estado === "pendiente" || c.estado === "recordatorio_enviado"
  );
  const citasPasadas = citas.filter(
    (c) => c.estado === "completada" || c.estado === "cancelada_cliente" || c.estado === "cancelada_admin" || c.estado === "no_show"
  );
  const citasMostrar = filtro === "proximas" ? citasProximas : citasPasadas;

  const ESTADO_LABELS: Record<string, string> = {
    confirmada: "Confirmada",
    pendiente: "Esperando Confirmación",
    recordatorio_enviado: "Recordatorio Enviado",
    completada: "Completada",
    cancelada_cliente: "Cancelada por ti",
    cancelada_admin: "Cancelada por barbería",
    no_show: "No asistió",
  };

  const ESTADO_COLORS: Record<string, string> = {
    confirmada: "bg-teal-500",
    pendiente: "bg-[var(--gold)]",
    recordatorio_enviado: "bg-blue-500",
    completada: "bg-green-500",
    cancelada_cliente: "bg-red-500",
    cancelada_admin: "bg-red-500",
    no_show: "bg-amber-500",
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
          <h1 className="text-2xl font-black text-[var(--white)]">Mis Citas</h1>
          <p className="text-sm text-[var(--muted)]">Gestiona tus servicios programados</p>
        </div>
      </div>

      {/* Alerta de citas pendientes */}
      {filtro === "proximas" && citasProximas.some(c => c.estado === "pendiente") && (
        <div className="p-4 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center flex-shrink-0 text-[var(--gold)]">
            <Clock size={20} />
          </div>
          <div>
            <p className="font-bold text-[var(--gold)]">Citas pendientes de confirmar</p>
            <p className="text-sm text-[var(--gold)]/80">Tienes citas que aún deben ser aprobadas por el barbero o administrador. Te notificaremos en cuanto cambien de estado.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setFiltro("proximas")}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            filtro === "proximas"
              ? "bg-[var(--gold)] text-[var(--dark)] shadow-lg shadow-[var(--gold)]/20"
              : "text-[var(--muted)] hover:text-[var(--white)]"
          }`}
        >
          <Clock size={16} />
          Próximas
        </button>
        <button
          onClick={() => setFiltro("historial")}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
            filtro === "historial"
              ? "bg-[var(--gold)] text-[var(--dark)] shadow-lg shadow-[var(--gold)]/20"
              : "text-[var(--muted)] hover:text-[var(--white)]"
          }`}
        >
          <History size={16} />
          Historial
        </button>
      </div>

      <div className="space-y-4">
        {citasMostrar.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.1)] text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[var(--muted)] opacity-30" />
            </div>
            <p className="text-[var(--muted)] font-medium">
              {filtro === "proximas" ? "No tienes citas para mostrar" : "Tu historial está vacío"}
            </p>
            {filtro === "proximas" && (
              <Link
                href="/usuario/reservar"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-black text-sm hover:scale-105 transition-transform"
              >
                Agendar ahora
                <ChevronRight size={18} />
              </Link>
            )}
          </div>
        ) : (
          citasMostrar.map((cita) => (
            <div
              key={cita.id}
              className="group p-5 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.12)] hover:border-[rgba(201,168,76,0.25)] transition-all relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/5">
                    <p className="text-[10px] font-black uppercase text-[var(--gold)]">
                      {new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-MX", { month: "short" })}
                    </p>
                    <p className="text-xl font-black text-[var(--white)] leading-none">
                      {cita.fecha.split("-")[2]}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${ESTADO_COLORS[cita.estado] || "bg-[var(--muted)]"}`} />
                      <p className="font-bold text-[var(--white)] text-lg">{cita.servicio_nombre}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <p className="text-sm text-[var(--muted)] flex items-center gap-1">
                        {cita.barberia_nombre} <span className="opacity-30">•</span> {cita.barbero_nombre}
                      </p>
                      {cita.estado === "pendiente" && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[10px] font-black text-[var(--gold)] uppercase tracking-wider">
                          Por Confirmar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:text-right border-t border-white/5 md:border-0 pt-3 md:pt-0">
                  <div>
                    <p className="text-xs text-[var(--muted)] uppercase font-black tracking-widest mb-1 opacity-50">Horario</p>
                    <p className="text-[var(--white)] font-bold">{cita.hora} <span className="text-[var(--muted)] font-normal ml-1">({cita.duracion_min} min)</span></p>
                  </div>
                  <div className="md:ml-8">
                    <p className="text-xs text-[var(--muted)] uppercase font-black tracking-widest mb-1 opacity-50">Precio</p>
                    <p className="text-[var(--gold)] font-black text-xl">{formatPrecio(cita.precio)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
