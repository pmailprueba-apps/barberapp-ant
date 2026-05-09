"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, User, Scissors, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { disponibilidadPorFecha, Slot } from "@/lib/slots";
import { toast } from "sonner";
import { formatPrecio } from "@/lib/utils";
import { useCallback } from "react";

export default function ReservarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [barberia, setBarberia] = useState<any | null>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  
  const [servicioId, setServicioId] = useState("");
  const [barberoId, setBarberoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchDefaultBarberia = async () => {
      try {
        let bId = user?.barberia_id;
        
        if (!bId) {
          const q = query(collection(db, "barberias"), where("estado", "==", "activa"), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            bId = snap.docs[0].id;
          }
        }

        if (bId) {
          const bDoc = await getDoc(doc(db, "barberias", bId));
          if (bDoc.exists()) {
            const data = bDoc.data();
            setBarberia({ id: bDoc.id, ...data });
            setServicios(data.servicios?.filter((s: any) => s.activo) || []);
          }
          
          // Cargar Barberos de forma robusta
          const barberosMap = new Map<string, any>();
          
          const queries = [
            query(collection(db, "usuarios"), where("barberia_id", "==", bId), where("role", "==", "barbero")),
            query(collection(db, "usuarios"), where("barberiaId", "==", bId), where("role", "==", "barbero")),
            query(collection(db, "empleados"), where("barberia_id", "==", bId), where("rol", "==", "barbero")),
            query(collection(db, "empleados"), where("barberiaId", "==", bId), where("rol", "==", "barbero"))
          ];

          const snapshots = await Promise.all(queries.map(q => getDocs(q).catch(() => ({ docs: [] } as any))));
          
          snapshots.forEach(snap => {
            snap.docs?.forEach((d: any) => {
              if (!barberosMap.has(d.id)) {
                const data = d.data();
                barberosMap.set(d.id, { 
                  id: d.id, 
                  nombre: data.nombre || data.displayName || data.email?.split("@")[0] || "Barbero"
                });
              }
            });
          });

          setBarberos(Array.from(barberosMap.values()));
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        toast.error("Error al cargar la información de la barbería");
      }
    };
    fetchDefaultBarberia();
  }, [user]);

  const cargarSlots = useCallback(async () => {
    if (!barberia?.id || !fecha) return;
    
    setLoadingSlots(true);
    try {
      // Validar anticipación antes de pedir slots
      const fechaSeleccionada = new Date(fecha + "T00:00:00");
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const diffTime = fechaSeleccionada.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const maxDias = barberia?.dias_anticipacion || 5;

      if (diffDays > maxDias) {
        setSlots([]);
        toast.info(`Solo se permite agendar hasta con ${maxDias} días de anticipación`);
        return;
      }

      console.log(`Cargando slots para barberia: ${barberia.id}, fecha: ${fecha}, barbero: ${barberoId}`);
      const s = await disponibilidadPorFecha(barberia.id, fecha, barberoId);
      setSlots(s);
    } catch (e: any) {
      console.error("Error en cargarSlots:", e);
      toast.error(e.message || "Error al cargar horarios disponibles");
    } finally {
      setLoadingSlots(false);
    }
  }, [barberia?.id, fecha, barberoId, barberia?.dias_anticipacion]);

  useEffect(() => {
    cargarSlots();
  }, [cargarSlots]);

  const handleReservar = async () => {
    if (loading) return;
    if (!user?.uid || !barberia || !servicioId || !fecha || !hora) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const fechaSeleccionada = new Date(fecha + "T00:00:00");
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((fechaSeleccionada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    const maxDias = barberia?.dias_anticipacion || 5;
    if (diffDays > maxDias) {
      toast.error(`Solo puedes agendar con un máximo de ${maxDias} días de anticipación`);
      return;
    }

    setLoading(true);
    try {
      const selectedService = servicios.find(s => s.id === servicioId);
      const selectedSlot = slots.find(s => s.hora === hora);
      
      if (!selectedService) {
        toast.error("Servicio no válido seleccionado");
        return;
      }
      
      // Lógica de barbero: 
      // 1. Si eligió uno específico, usar ese.
      // 2. Si eligió "Cualquiera", usar el primero libre del slot seleccionado.
      // 3. Fallback al primer barbero de la lista (aunque esto no debería pasar si hay slots).
      let finalBarberoId = barberoId;
      if (!barberoId || barberoId === "cualquiera") {
        finalBarberoId = selectedSlot?.barberosLibres[0]?.id || barberos[0]?.id;
      }

      if (!finalBarberoId) {
        throw new Error("No hay barberos disponibles para este horario");
      }

      console.log("Iniciando reserva...");
      const loadingToast = toast.loading("Procesando tu reserva... por favor espera");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/barberias/${barberia.id}/citas`, {
          method: "POST",
          signal: controller.signal,
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            clienteId: user.uid,
            barberoId: finalBarberoId,
            servicioId,
            fecha,
            hora,
            precio: selectedService.precio || 0,
            servicioNombre: selectedService.nombre || "Servicio",
            duracionMin: selectedService.duracion_min || 30
          }),
        });

        if (!res.ok) {
          let errorMessage = "Error al crear la reserva";
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // Si no es JSON, intentar leer texto
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("Reserva exitosa:", data);
        toast.success(`¡Cita agendada para el ${fecha} a las ${hora}!`, {
          duration: 6000,
        });
        router.push("/usuario/citas");
        
      } catch (err: any) {
        console.error("ERROR EN RESERVA:", err);
        
        if (err.name === 'AbortError') {
          toast.error("La conexión tardó demasiado. Por seguridad, revisa 'Mis Citas' para ver si se creó.", {
            duration: 6000
          });
        } else {
          toast.error(err.message || "No se pudo completar la reserva");
        }
      } finally {
        toast.dismiss(loadingToast);
        clearTimeout(timeoutId);
        setLoading(false);
      }
    } catch (outerError: any) {
      console.error("Error EXTERNO en handleReservar:", outerError);
      setLoading(false);
      toast.error("Error al iniciar el proceso de reserva");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--white)]" />
        </button>
        <h1 className="text-2xl font-black text-[var(--white)]">Reservar Cita</h1>
      </div>

      <div className="bg-[var(--card)] p-6 rounded-3xl border border-white/5 shadow-2xl">
        {/* Barbería (Fija) */}
        <div className="mb-8 p-5 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
              <MapPin size={24} className="text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-[var(--gold)]">Tu Barbería</p>
              <h3 className="text-xl font-bold text-[var(--white)]">{barberia ? barberia.nombre : "Cargando..."}</h3>
            </div>
          </div>
          <CheckCircle2 size={24} className="text-[var(--gold)]" />
        </div>

        <div className="space-y-8">
          {/* 1. Selección de Servicio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--white)] font-bold">
              <Scissors size={18} className="text-[var(--gold)]" />
              <span>Selecciona el servicio</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servicios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setServicioId(s.id)}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                    servicioId === s.id 
                    ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--dark)]" 
                    : "bg-white/5 border-white/5 text-[var(--white)] hover:bg-white/10"
                  }`}
                >
                  <span className="font-bold">{s.nombre}</span>
                  <span className={servicioId === s.id ? "text-[var(--dark)]/70" : "text-[var(--gold)]"}>
                    {formatPrecio(s.precio)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Selección de Barbero */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--white)] font-bold">
              <User size={18} className="text-[var(--gold)]" />
              <span>Elige barbero (opcional)</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {barberos.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBarberoId(b.id)}
                  className={`flex-shrink-0 w-24 text-center space-y-2 transition-all ${
                    barberoId === b.id ? "scale-110" : "opacity-60"
                  }`}
                >
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                    barberoId === b.id ? "border-[var(--gold)] bg-[var(--gold)]/20" : "border-white/10 bg-white/5"
                  }`}>
                    {b.nombre?.[0] || "B"}
                  </div>
                  <p className="text-xs font-medium text-[var(--white)] truncate">{b.nombre}</p>
                </button>
              ))}
              <button
                onClick={() => setBarberoId("")}
                className={`flex-shrink-0 w-24 text-center space-y-2 transition-all ${
                  barberoId === "" || barberoId === "cualquiera" ? "scale-110" : "opacity-60"
                }`}
              >
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                  barberoId === "" || barberoId === "cualquiera" ? "border-[var(--gold)] bg-[var(--gold)]/20" : "border-white/10 bg-white/5"
                }`}>
                  ?
                </div>
                <p className="text-xs font-medium text-[var(--white)]">Cualquiera</p>
              </button>
            </div>
          </div>

          {/* 3. Selección de Fecha y Hora */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[var(--white)] font-bold">
              <CalendarIcon size={18} className="text-[var(--gold)]" />
              <span>Elige fecha y hora</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)] font-black uppercase tracking-widest ml-1">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(Date.now() + (barberia?.dias_anticipacion || 5) * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
                />
              </div>

              {/* Hora */}
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)] font-black uppercase tracking-widest ml-1">Hora disponible</label>
                {!fecha ? (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-[var(--muted)] text-sm">
                    Selecciona una fecha primero
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-dashed border-red-500/20 text-red-400 text-sm">
                    No hay horarios disponibles para esta fecha
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {slots.map((s) => (
                      <button
                        key={s.hora}
                        disabled={!s.disponible}
                        onClick={() => setHora(s.hora)}
                        className={`relative p-3 rounded-2xl text-left transition-all border flex flex-col gap-1 ${
                          hora === s.hora
                            ? "bg-[var(--gold)] border-[var(--gold)] text-[var(--dark)] shadow-lg shadow-[var(--gold)]/20"
                            : s.disponible
                            ? "bg-white/5 border-white/10 text-[var(--white)] hover:border-white/30"
                            : "bg-white/[0.02] border-white/[0.05] text-[var(--muted)] opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">{s.hora}</span>
                          {s.disponible && (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        
                        {s.barberosOcupados.length > 0 && (
                          <div className="text-[9px] leading-tight opacity-70 italic truncate">
                            Ocupado: {s.barberosOcupados.map(b => b.nombre.split(" ")[0]).join(", ")}
                          </div>
                        )}

                        {!s.disponible && s.barberosOcupados.length === 0 && (
                          <div className="text-[9px] leading-tight text-red-400">
                            {s.razon === "margen" ? "Mín. Antelación" : "Pasado"}
                          </div>
                        )}

                        {s.disponible && (
                          <div className="text-[9px] leading-tight text-emerald-400 font-medium">
                            Disponible
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón Reservar */}
        <div className="mt-10 pt-6 border-t border-white/5">
          <button
            onClick={handleReservar}
            disabled={loading || !servicioId || !fecha || !hora}
            className="w-full py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black text-lg uppercase tracking-widest shadow-xl shadow-[var(--gold)]/10 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? "Confirmando..." : "Confirmar Reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
