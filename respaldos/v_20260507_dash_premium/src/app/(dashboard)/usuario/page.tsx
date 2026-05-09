"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { formatFecha, formatHora, formatPrecio } from "@/lib/utils";
import { PuntosCard } from "@/components/ui/puntos-badge";
import { Modal } from "@/components/ui/modal";
import { RatingInput } from "@/components/ui/rating-input";
import { ClienteCancelModal } from "@/components/ui/cliente-cancel-modal";
import { cancelarCita } from "@/lib/citas";
import { toast } from "sonner";
import { Calendar, QrCode, Plus, Star, ChevronRight, XCircle } from "lucide-react";

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

export default function ClienteDashboard() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<CitaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [puntos, setPuntos] = useState(0);
  const [filtro, setFiltro] = useState<"proximas" | "historial">("proximas");
  const [selectedCitaForRating, setSelectedCitaForRating] = useState<CitaCliente | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<CitaCliente | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    cargarDatos();
  }, [user?.uid]);

  const cargarDatos = async () => {
    if (!user?.uid) return;
    try {
      const [puntosRes, citasRes] = await Promise.all([
        fetch("/api/puntos", { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }),
        fetch(`/api/cliente/${user.uid}/citas`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } }),
      ]);

      if (puntosRes.ok) {
        const p = await puntosRes.json();
        setPuntos(p.puntos || 0);
      }

      if (citasRes.ok) {
        const c = await citasRes.json();
        setCitas(c);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async (reason: string) => {
    if (!citaToCancel) return;

    setIsCancelling(citaToCancel.id);
    try {
      const res = await cancelarCita(citaToCancel.barberia_id, citaToCancel.id, reason);
      if (res.success) {
        toast.success("Cita cancelada con éxito");
        cargarDatos();
      } else {
        toast.error(res.error || "No se pudo cancelar la cita");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cancelar la cita");
    } finally {
      setIsCancelling(null);
    }
  };

  const openCancelModal = (cita: CitaCliente) => {
    setCitaToCancel(cita);
    setCancelModalOpen(true);
  };

  const canRedeem = puntos >= 500;

  const handleRedeem = async () => {
    if (!canRedeem) return;
    toast.success("¡Felicidades! Presenta este código en tu próxima visita para obtener un corte gratis o un producto especial.");
  };

  const citasProximas = citas.filter(
    (c) => c.estado === "confirmada" || c.estado === "pendiente" || c.estado === "recordatorio_enviado"
  );
  const citasPasadas = citas.filter(
    (c) => c.estado === "completada" || c.estado === "cancelada_cliente" || c.estado === "cancelada_admin" || c.estado === "no_show"
  );
  const citasMostrar = filtro === "proximas" ? citasProximas : citasPasadas;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Mi Cuenta</h1>
          <p className="text-sm text-[var(--muted)] mt-1">@{user?.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--muted)]">Membresía</p>
          <p className="text-sm font-bold text-[var(--gold)]">Cliente</p>
        </div>
      </div>

      {/* Crear Cita Card */}
      <Link
        href="/usuario/reservar"
        className="block p-6 rounded-2xl bg-gradient-to-r from-[var(--gold)]/20 to-[var(--gold)]/5 border border-[var(--gold)]/30 hover:border-[var(--gold)]/50 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--gold)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={28} className="text-[var(--dark)]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[var(--white)]">Crear Nueva Cita</h3>
              <p className="text-sm text-[var(--muted)]">Agenda tu próxima visita con un click</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-[var(--gold)] group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Puntos Card */}
      <div className="relative overflow-hidden group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--gold)] to-[#D9B34D] rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
        <div className="relative">
          <PuntosCard
            puntos={puntos}
            siguienteRecompensa="Bono Especial BarberApp"
            puntosParaSiguiente={500}
          />
          {canRedeem && (
            <button
              onClick={handleRedeem}
              className="absolute top-4 right-4 bg-green-500 text-[var(--dark)] text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-green-400/50 animate-pulse hover:scale-105 transition-transform"
            >
              ¡CANJEAR AHORA!
            </button>
          )}
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro("proximas")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
            filtro === "proximas"
              ? "bg-[var(--gold)] text-[var(--dark)]"
              : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--white)]"
          }`}
        >
          Próximas ({citasProximas.length})
        </button>
        <button
          onClick={() => setFiltro("historial")}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
            filtro === "historial"
              ? "bg-[var(--gold)] text-[var(--dark)]"
              : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--white)]"
          }`}
        >
          Historial ({citasPasadas.length})
        </button>
      </div>

      {/* Lista de citas */}
      <div className="space-y-3">
        {citasMostrar.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.1)] text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-[var(--muted)] opacity-50" />
            <p className="text-[var(--muted)]">
              {filtro === "proximas" ? "No tienes citas programadas" : "Aún no tienes visitas"}
            </p>
            <Link
              href="/usuario/reservar"
              className="inline-block mt-4 px-4 py-2 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold text-sm hover:opacity-90"
            >
              Reservar ahora
            </Link>
          </div>
        ) : (
          citasMostrar.map((cita) => (
            <div
              key={cita.id}
              className="p-4 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.12)] hover:border-[rgba(201,168,76,0.25)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${ESTADO_COLORS[cita.estado] || "bg-[var(--muted)]"}`} />
                    <p className="font-bold text-[var(--white)]">{cita.servicio_nombre}</p>
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${
                      cita.estado === 'pendiente' 
                        ? 'bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20' 
                        : cita.estado === 'confirmada'
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        : 'bg-white/5 text-[var(--muted)] border-white/10'
                    }`}>
                      {cita.estado === 'pendiente' ? 'Esperando Confirmación' : cita.estado}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{cita.barberia_nombre}</p>
                  <p className="text-xs text-[var(--muted)]">Con {cita.barbero_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--gold)]">{formatPrecio(cita.precio)}</p>
                  <p className="text-sm text-[var(--white)]">{formatFecha(cita.fecha)}</p>
                  <p className="text-xs text-[var(--muted)]">{cita.hora} • {cita.duracion_min} min</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-3 border-t border-[rgba(201,168,76,0.06)] flex justify-between items-center">
                {filtro === "proximas" && (
                  <button
                    onClick={() => openCancelModal(cita)}
                    disabled={isCancelling === cita.id}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    {isCancelling === cita.id ? "Cancelando..." : "Cancelar cita"}
                  </button>
                )}

                {filtro === "historial" && cita.estado === "completada" && (
                  <div className="w-full">
                    {cita.calificacion ? (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[var(--muted)]">Tu calificación</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={14}
                              className={`${n <= (cita.calificacion || 0) ? "text-[var(--gold)] fill-[var(--gold)]" : "text-[var(--muted)]/20"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedCitaForRating(cita)}
                        className="w-full py-2 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-xs font-bold hover:bg-[var(--gold)]/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Star size={14} />
                        Calificar servicio
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Calificación */}
      <Modal
        isOpen={!!selectedCitaForRating}
        onClose={() => setSelectedCitaForRating(null)}
        title="Calificar Servicio"
      >
        {selectedCitaForRating && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--dark)] border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] font-bold">
                {selectedCitaForRating.barbero_nombre.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--white)]">{selectedCitaForRating.servicio_nombre}</p>
                <p className="text-xs text-[var(--muted)]">Con {selectedCitaForRating.barbero_nombre}</p>
              </div>
            </div>

            <RatingInput
              citaId={selectedCitaForRating.id}
              barberiaId={selectedCitaForRating.barberia_id}
              onCalificado={() => {
                setTimeout(() => {
                  setSelectedCitaForRating(null);
                  cargarDatos();
                }, 1500);
              }}
            />
          </div>
        )}
      </Modal>

      {/* Modal de Cancelación */}
      <ClienteCancelModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setCitaToCancel(null);
        }}
        onConfirm={handleCancelar}
        servicioNombre={citaToCancel?.servicio_nombre || ""}
        barberoNombre={citaToCancel?.barbero_nombre || ""}
        fecha={citaToCancel ? formatFecha(citaToCancel.fecha) : ""}
        hora={citaToCancel?.hora || ""}
      />
    </div>
  );
}