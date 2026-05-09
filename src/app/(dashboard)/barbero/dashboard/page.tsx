"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatFecha, formatPrecio } from "@/lib/utils";
import { Check, X, Calendar, Clock, Scissors, User, AlertTriangle, RefreshCw } from "lucide-react";
import { CitaService } from "@/services/citaService";
import { toast } from "sonner";
import { ConfirmCancelModal } from "@/components/ui/confirm-cancel-modal";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface MisCitas {
  id: string;
  cliente_nombre: string;
  servicio_nombre: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: string;
}

export default function BarberoDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [citas, setCitas] = useState<MisCitas[]>([]);
  const [citasPendientes, setCitasPendientes] = useState<MisCitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalDia, setTotalDia] = useState(0);
  const [completadas, setCompletadas] = useState(0);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<MisCitas | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const userBarberiaIdRef = useRef<string | undefined>(undefined);
  const userBarberoIdRef = useRef<string | undefined>(undefined);

  // Sincronizar refs de user sin causar re-renders del useEffect
  useEffect(() => {
    userBarberiaIdRef.current = user?.barberia_id;
    userBarberoIdRef.current = user?.barbero_id;
  }, [user?.barberia_id, user?.barbero_id]);

  const cargarBarberoDashboard = useCallback(async (silent = false) => {
    const barberiaId = userBarberiaIdRef.current;
    const barberoId = userBarberoIdRef.current;

    if (!barberiaId || !barberoId) {
      setLoading(false);
      return;
    }
    if (!silent) setRefreshing(true);

    // Cancelar petición previa si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const hoy = new Date().toLocaleDateString('sv-SE');
      const token = await user?.getIdToken();

      const [misCitas, misPendientes] = await Promise.all([
        CitaService.getByBarberia(barberiaId, { fecha: hoy, barberoId }, token, controller.signal),
        CitaService.getByBarberia(barberiaId, { estado: "pendiente" }, token, controller.signal)
      ]);

      setCitas(misCitas);
      const total = misCitas.reduce((sum: number, c: MisCitas) => sum + (c.precio || 0), 0);
      setTotalDia(total);
      setCompletadas(misCitas.filter((c: MisCitas) => c.estado === "completada").length);
      setCitasPendientes(misPendientes);
    } catch (e: any) {
      // Safari/iPad lanza estos errores cuando la conexión parpadea o se aborta
      const ignoreErrors = ['AbortError', 'Load failed', 'Failed to fetch', 'NetworkError', 'Software caused connection abort'];
      if (ignoreErrors.some(err => e.name === err || e.message?.includes(err))) {
        console.log("Petición omitida (Safari/iPad safe check)");
      } else {
        console.error("Error cargarBarberoDashboard:", e);
      }
    } finally {
      // Siempre resolver loading al terminar (éxito o error ignorable)
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []); // Sin dependencias - usa refs

  useEffect(() => {
    // Timeout de seguridad: si loading nunca se resuelve en 15s, forzar salida
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 15000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (user.barberia_id && user.barbero_id) {
      // Sincronización en tiempo real vía Firestore
      const citasRef = collection(db, "barberias", user.barberia_id, "citas");
      let unsubscribe: () => void;

      try {
        unsubscribe = onSnapshot(citasRef, (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
              if (isMountedRef.current) cargarBarberoDashboard(true);
            }, 2000);
          }
        });
      } catch (err) {
        console.error("Error en onSnapshot:", err);
        setLoading(false);
      }

      return () => {
        isMountedRef.current = false;
        if (unsubscribe) unsubscribe();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setLoading(false);
    }
  }, [user, authLoading, cargarBarberoDashboard]);

  const handleEstadoCita = async (citaId: string, nuevoEstado: string, data: any = {}) => {
    if (!user?.barberia_id) return;
    
    const loadingId = toast.loading(`${nuevoEstado === 'confirmada' ? 'Confirmando' : nuevoEstado === 'completada' ? 'Finalizando' : 'Cancelando'} cita...`);
    
    try {
      const token = await user.getIdToken();
      await CitaService.updateEstado(user.barberia_id, citaId, nuevoEstado as any, data, token);
      
      toast.success("Estado actualizado", { id: loadingId });
      cargarBarberoDashboard();
    } catch (e: any) {
      toast.error(e.message || "No se pudo actualizar la cita", { id: loadingId });
      cargarBarberoDashboard();
    }
  };

  const openCancelModal = (cita: MisCitas) => {
    setCitaToCancel(cita);
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!citaToCancel) return;
    await handleEstadoCita(citaToCancel.id, "cancelada_admin", { motivo: reason });
    setConfirmCancelOpen(false);
    setCitaToCancel(null);
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

  // Si es barbero pero no tiene barberia_id o barbero_id, es un error de configuración
  if (user?.role === "barbero" && (!user?.barberia_id || !user?.barbero_id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h1 className="text-2xl font-black text-white mb-2">Perfil no vinculado</h1>
        <p className="text-[var(--muted)] max-w-md">
          Tu cuenta de barbero aún no ha sido vinculada a una barbería específica. Contacta a tu administrador.
        </p>
      </div>
    );
  }

  // Si no está activo (aprobado por el admin)
  if (user?.role === "barbero" && user?.activo === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 text-amber-500">
          <div className="animate-pulse font-black text-4xl">!</div>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Validación en Proceso</h1>
        <p className="text-[var(--muted)] max-w-md mb-8">
          Estamos esperando a que el administrador de tu barbería confirme tu ingreso al equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[var(--white)]">Mi Día</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{formatFecha(new Date().toISOString())}</p>
          </div>
          <button 
            onClick={() => cargarBarberoDashboard()}
            disabled={refreshing}
            className={`p-2 rounded-xl bg-[var(--card)] border border-[rgba(201,168,76,0.1)] text-[var(--gold)] hover:bg-[var(--gold)]/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
            title="Refrescar datos"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        {user?.barberia_nombre && (
          <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-[var(--gold)] rounded-full animate-pulse" />
            <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">{user.barberia_nombre}</span>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.12)] text-center shadow-xl">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-black mb-2">Citas</p>
          <p className="text-4xl font-black text-[var(--white)]">{citas.length}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.12)] text-center shadow-xl">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-black mb-2">Completadas</p>
          <p className="text-4xl font-black text-[var(--green)]">{completadas}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.12)] text-center shadow-xl">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-[0.2em] font-black mb-2">Ventas</p>
          <p className="text-3xl font-black text-[var(--gold)]">{formatPrecio(totalDia)}</p>
        </div>
      </div>

      {/* Pending Section */}
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
                    {formatFecha(cita.fecha)} - {cita.hora} | {cita.servicio_nombre}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleEstadoCita(cita.id, "confirmada")}
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

      {/* Mis citas */}
      <div className="rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[rgba(201,168,76,0.1)]">
          <h2 className="font-bold text-[var(--white)]">Mis citas de hoy</h2>
        </div>
        {citas.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted)]">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No tienes citas programadas para hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-[rgba(201,168,76,0.05)]">
            {citas.map((cita) => (
              <div key={cita.id} className="p-4 flex items-center gap-4 hover:bg-[var(--gold)]/5 transition-colors group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--gold)]">{cita.hora}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--white)] truncate">{cita.cliente_nombre || "Cliente"}</p>
                  <p className="text-sm text-[var(--muted)]">{cita.servicio_nombre}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ESTADO_COLORS[cita.estado]?.replace("bg-", "text-") || "text-[var(--muted)]"}`}>
                    {cita.estado.replace("_", " ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--gold)] mr-2">{formatPrecio(cita.precio)}</span>
                    
                    <div className="flex items-center gap-1">
                      {cita.estado === "pendiente" && (
                        <button
                          onClick={() => handleEstadoCita(cita.id, "confirmada")}
                          className="p-2 rounded-xl bg-[var(--teal)] text-white hover:scale-105 transition-all shadow-lg shadow-[var(--teal)]/20"
                          title="Confirmar cita"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      
                      {cita.estado === "confirmada" && (
                        <button
                          onClick={() => handleEstadoCita(cita.id, "en_curso")}
                          className="p-2 rounded-xl bg-[var(--blue)] text-white hover:scale-105 transition-all shadow-lg shadow-[var(--blue)]/20"
                          title="Iniciar servicio"
                        >
                          <Clock size={14} />
                        </button>
                      )}

                      {cita.estado === "en_curso" && (
                        <button
                          onClick={() => handleEstadoCita(cita.id, "completada")}
                          className="p-2 rounded-xl bg-[var(--green)] text-white hover:scale-105 transition-all shadow-lg shadow-[var(--green)]/20"
                          title="Finalizar servicio"
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                      )}

                      <button
                        onClick={() => openCancelModal(cita)}
                        className="p-2 rounded-xl bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Cancelar cita"
                      >
                        <X size={14} />
                      </button>
                    </div>
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