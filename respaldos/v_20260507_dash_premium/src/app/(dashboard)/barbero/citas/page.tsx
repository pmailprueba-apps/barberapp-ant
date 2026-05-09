"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { formatFecha, formatPrecio } from "@/lib/utils";
import { Calendar, Filter, Search, Play, XCircle, CheckCircle2, Clock, AlertCircle, Check } from "lucide-react";
import { CitaService } from "@/services/citaService";
import { Cita, CitaEstado } from "@/types/firebase";
import { toast } from "sonner";
import { ConfirmCancelModal } from "@/components/ui/confirm-cancel-modal";

export default function BarberoCitasPage() {
  const { user } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertasEnviadas, setAlertasEnviadas] = useState<Set<string>>(new Set());
  const [citasPendientes, setCitasPendientes] = useState<Cita[]>([]);

  const cargarCitas = useCallback(async () => {
    if (!user?.barberia_id || !user?.barbero_id) {
      toast.error("Barbero no tiene barberia_id o barbero_id configurado");
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();

      // Fetch ALL citas and pending ones using CitaService
      const [todasCitas, pendientes] = await Promise.all([
        CitaService.getByBarberia(user.barberia_id, { barberoId: user.barbero_id }, token),
        CitaService.getByBarberia(user.barberia_id, { estado: "pendiente", barberoId: user.barbero_id }, token)
      ]);

      toast.success(`Cargadas ${todasCitas.length} citas, ${pendientes.length} pendientes`);

      // Ordenar por fecha y hora (más recientes primero)
      const ordenadas = todasCitas.sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
        const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
        return dateB - dateA;
      });

      setCitas(ordenadas);
      setCitasPendientes(pendientes);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [user?.barberia_id, user?.barbero_id]);

  useEffect(() => {
    if (user?.barberia_id && user?.barbero_id) {
      cargarCitas();
      const interval = setInterval(cargarCitas, 30000); // Recargar cada 30s
      return () => clearInterval(interval);
    }
  }, [user?.barberia_id, user?.barbero_id, cargarCitas]);

  // Lógica de Recordatorios
  useEffect(() => {
    const checkReminders = () => {
      const ahora = new Date();
      citas.forEach(cita => {
        if (cita.estado !== "confirmada") return;
        
        const fechaCita = new Date(`${cita.fecha}T${cita.hora}`);
        const diffMs = fechaCita.getTime() - ahora.getTime();
        const diffMin = Math.round(diffMs / 60000);

        // Alerta 1 hora (60 min)
        if (diffMin <= 60 && diffMin > 55 && !alertasEnviadas.has(`${cita.id}-60`)) {
          toast.info(`Cita en 1 hora: ${cita.cliente_nombre}`, {
            description: `${cita.servicio_nombre} a las ${cita.hora}`,
            duration: 10000,
          });
          setAlertasEnviadas(prev => new Set(prev).add(`${cita.id}-60`));
        }

        // Alerta 30 min
        if (diffMin <= 30 && diffMin > 25 && !alertasEnviadas.has(`${cita.id}-30`)) {
          toast.warning(`¡Cita en 30 minutos!: ${cita.cliente_nombre}`, {
            description: `Prepárate para el servicio de las ${cita.hora}`,
            duration: 15000,
          });
          setAlertasEnviadas(prev => new Set(prev).add(`${cita.id}-30`));
        }
      });
    };

    const timer = setInterval(checkReminders, 10000);
    return () => clearInterval(timer);
  }, [citas, alertasEnviadas]);

  const [modalFinalizar, setModalFinalizar] = useState<{ open: boolean, citaId: string, notas: string }>({
    open: false,
    citaId: "",
    notas: ""
  });

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [citaToCancel, setCitaToCancel] = useState<Cita | null>(null);

  const openCancelModal = (cita: Cita) => {
    setCitaToCancel(cita);
    setCancelModalOpen(true);
  };

  const handleCancelarConMotivo = async (reason: string) => {
    if (!citaToCancel || !user?.barberia_id) return;
    try {
      const token = await user.getIdToken();
      await CitaService.updateEstado(user.barberia_id, citaToCancel.id, "cancelada_admin", { motivo_cancelacion: reason }, token);
      toast.success("Cita cancelada correctamente");
      cargarCitas();
    } catch (e) {
      toast.error("No se pudo cancelar la cita");
    }
  };

  const handleConfirmarCita = async (citaId: string) => {
    if (!user?.barberia_id) return;
    try {
      const token = await user.getIdToken();
      await CitaService.updateEstado(user.barberia_id, citaId, "confirmada", {}, token);
      toast.success("Cita confirmada");
      cargarCitas();
    } catch (e) {
      toast.error("No se pudo confirmar la cita");
    }
  };

  const handleUpdateStatus = async (citaId: string, nuevoEstado: CitaEstado, extraData?: any) => {
    if (!user?.barberia_id) return;

    // Verificar si ya hay una cita en curso para este barbero
    const citaEnCurso = citas.find(c => c.estado === "en_curso");
    if (nuevoEstado === "en_curso" && citaEnCurso) {
      toast.error("Ya tienes una cita en curso", {
        description: "Debes terminar o marcar como 'No llegó' la cita actual antes de empezar otra."
      });
      return;
    }

    try {
      const token = await user.getIdToken();
      await CitaService.updateEstado(user.barberia_id, citaId, nuevoEstado, extraData, token);
      toast.success(nuevoEstado === "en_curso" ? "¡Servicio iniciado!" : "Estado actualizado");
      setModalFinalizar({ open: false, citaId: "", notas: "" });
      cargarCitas();
    } catch (e) {
      toast.error("No se pudo actualizar la cita");
    }
  };

  const ESTADO_UI: Record<string, { color: string, label: string, icon?: any }> = {
    confirmada: { color: "bg-blue-500/20 text-blue-400", label: "Confirmada" },
    en_curso: { color: "bg-amber-500/20 text-amber-400", label: "En Curso", icon: Play },
    completada: { color: "bg-green-500/20 text-green-400", label: "Completada", icon: CheckCircle2 },
    no_show: { color: "bg-red-500/20 text-red-400", label: "No llegó", icon: XCircle },
    cancelada_cliente: { color: "bg-gray-500/20 text-gray-400", label: "Cancelada (Cliente)" },
    cancelada_admin: { color: "bg-red-500/20 text-red-400", label: "Cancelada (Admin)", icon: XCircle },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const citaActual = citas.find(c => c.estado === "en_curso");
  const proximasCitas = citas.filter(c => c.estado === "confirmada").reverse();
  const handleNotificarRetraso = async (siguienteCita: Cita) => {
    try {
      const token = await user!.getIdToken();
      toast.promise(
        CitaService.updateEstado(user!.barberia_id!, siguienteCita.id, siguienteCita.estado, { 
          notas_barbero: (siguienteCita.notas_barbero || "") + "\n[Sistema: Cliente notificado de retraso]" 
        }, token),
        {
          loading: "Enviando aviso de retraso...",
          success: "Cliente notificado del retraso",
          error: "No se pudo enviar la notificación"
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  const isOvertime = (cita: Cita) => {
    const inicio = new Date(`${cita.fecha}T${cita.hora}`);
    const finEstimado = new Date(inicio.getTime() + (cita.duracion_min || 30) * 60000);
    return new Date() > finEstimado;
  };

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
    <div className="space-y-8 pb-20">
      {/* Modal Finalizar con Notas */}
      {modalFinalizar.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-white mb-2">Finalizar Servicio</h3>
            <p className="text-sm text-[var(--muted)] mb-6">¿Quieres anotar algo sobre este corte para recordarlo la próxima vez?</p>
            
            <textarea 
              value={modalFinalizar.notas}
              onChange={(e) => setModalFinalizar(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Ej: Desvanecido con grado 0, usa navaja, peinado hacia la derecha..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-[var(--gold)] transition-all resize-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setModalFinalizar({ open: false, citaId: "", notas: "" })}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => handleUpdateStatus(modalFinalizar.citaId, "completada", { notas_barbero: modalFinalizar.notas })}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-500/20 transition-all"
              >
                FINALIZAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pendientes de Confirmación */}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmarCita(cita.id)}
                    className="p-2 rounded-xl bg-[var(--teal)] text-white hover:scale-105 transition-all"
                    title="Confirmar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => openCancelModal(cita)}
                    className="p-2 rounded-xl bg-[var(--red)]/20 text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-all"
                    title="Rechazar"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección de Cita Actual / Siguiente */}
      <div className="grid grid-cols-1 gap-6">
        {citaActual ? (
          <div className={`relative overflow-hidden rounded-3xl p-6 transition-all border ${
            isOvertime(citaActual) 
              ? "bg-red-500/10 border-red-500/50" 
              : "bg-gradient-to-br from-amber-500/20 to-amber-600/5 border-amber-500/30"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`flex h-2 w-2 rounded-full ${isOvertime(citaActual) ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                <h2 className={`${isOvertime(citaActual) ? "text-red-500" : "text-amber-500"} font-black uppercase tracking-widest text-xs`}>
                  {isOvertime(citaActual) ? "TIEMPO EXCEDIDO" : "Servicio en Curso"}
                </h2>
              </div>
              {isOvertime(citaActual) && proximasCitas.length > 0 && (
                <button 
                  onClick={() => handleNotificarRetraso(proximasCitas[0])}
                  className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black rounded-full hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  <AlertCircle size={12} /> AVISAR RETRASO AL SIGUIENTE
                </button>
              )}
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-white mb-1">{citaActual.cliente_nombre}</h3>
                <p className="text-[var(--gold)] font-bold">{citaActual.servicio_nombre}</p>
                <div className="flex items-center gap-4 mt-4 text-[var(--muted)] text-sm">
                  <span className="flex items-center gap-1"><Clock size={14} /> {citaActual.hora}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {formatPrecio(citaActual.precio)}</span>
                </div>
              </div>
              <button 
                onClick={() => setModalFinalizar({ open: true, citaId: citaActual.id, notas: "" })}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                FINALIZAR <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        ) : proximasCitas.length > 0 ? (
          <div className="rounded-3xl bg-[var(--card)] border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-[var(--muted)] font-black uppercase tracking-widest text-xs">Siguiente Cita</h2>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1 w-full text-center md:text-left">
                <h3 className="text-2xl font-black text-white mb-1">{proximasCitas[0].cliente_nombre}</h3>
                <p className="text-[var(--gold)] font-bold">{proximasCitas[0].servicio_nombre} • {proximasCitas[0].hora}</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => openCancelModal(proximasCitas[0])}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center"
                  title="Cancelar cita"
                >
                  <XCircle size={18} />
                </button>
                <button 
                  onClick={() => handleUpdateStatus(proximasCitas[0].id, "no_show")}
                  className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  NO LLEGÓ <XCircle size={18} />
                </button>
                <button 
                  onClick={() => handleUpdateStatus(proximasCitas[0].id, "en_curso")}
                  className="flex-2 px-8 py-3 bg-[var(--gold)] hover:brightness-110 text-black font-black rounded-2xl transition-all shadow-lg shadow-[var(--gold)]/20 flex items-center justify-center gap-2"
                >
                  COMENZAR <Play size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Tabla de Historial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Historial de Citas</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-9 pr-4 py-2 rounded-xl bg-[var(--card)] border border-white/10 text-sm text-[var(--white)] outline-none focus:border-[var(--gold)] transition-all"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-[var(--card)] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Fecha/Hora</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Cliente</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Servicio</th>
                  <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{formatFecha(cita.fecha)}</p>
                      <p className="text-xs text-[var(--muted)]">{cita.hora}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white">{cita.cliente_nombre}</p>
                      <p className="text-[10px] text-[var(--muted)]">{cita.cliente_telefono}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{cita.servicio_nombre}</p>
                      <p className="text-xs font-black text-[var(--gold)]">{formatPrecio(cita.precio)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${ESTADO_UI[cita.estado]?.color || "bg-white/10 text-white"}`}>
                        {ESTADO_UI[cita.estado]?.icon && <span className="w-1 h-1 rounded-full bg-current" />}
                        {ESTADO_UI[cita.estado]?.label || cita.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmCancelModal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setCitaToCancel(null);
        }}
        onConfirm={handleCancelarConMotivo}
        nombreCliente={citaToCancel?.cliente_nombre}
        hora={citaToCancel ? `${formatFecha(citaToCancel.fecha)} - ${citaToCancel.hora}` : ""}
      />
    </div>
  );
}

