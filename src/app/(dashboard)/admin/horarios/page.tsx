"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { barberiaService } from "@/services/barberiaService";
import { Clock, Save, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Horarios } from "@/types/firebase";

const DIAS = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

export default function HorariosPage() {
  const { user } = useAuth();
  const [horarios, setHorarios] = useState<Horarios>({
    lunes: { abre: "09:00", cierra: "19:00", activo: true },
    martes: { abre: "09:00", cierra: "19:00", activo: true },
    miercoles: { abre: "09:00", cierra: "19:00", activo: true },
    jueves: { abre: "09:00", cierra: "19:00", activo: true },
    viernes: { abre: "09:00", cierra: "19:00", activo: true },
    sabado: { abre: "09:00", cierra: "14:00", activo: true },
    domingo: { abre: null, cierra: null, activo: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.barberia_id) {
      cargarHorarios(user.barberia_id);
    }
  }, [user?.barberia_id]);

  const cargarHorarios = async (id: string) => {
    try {
      const barberia = await barberiaService.getById(id);
      if (barberia?.horarios) {
        setHorarios(barberia.horarios);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (dia: string, field: string, value: any) => {
    setHorarios((prev: any) => ({
      ...prev,
      [dia]: { ...prev[dia], [field]: value },
    }));
    setSuccess(false);
  };

  const saveHorarios = async () => {
    if (!user?.barberia_id) return;
    setSaving(true);
    try {
      await barberiaService.update(user.barberia_id, { horarios });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Horarios de Atención</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Configura cuándo está abierta tu barbería para recibir citas</p>
        </div>
        <button
          onClick={saveHorarios}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          Horarios actualizados con éxito
        </div>
      )}

      <div className="space-y-3">
        {DIAS.map((dia) => {
          const config = (horarios as any)[dia.id];
          return (
            <div
              key={dia.id}
              className={`p-4 rounded-2xl bg-[var(--card)] border transition-all ${
                config.activo 
                  ? "border-[rgba(201,168,76,0.18)]" 
                  : "border-transparent opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleUpdate(dia.id, "activo", !config.activo)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${config.activo ? "bg-[var(--gold)]" : "bg-[var(--dark)] border border-white/10"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--dark)] transition-all ${config.activo ? "left-7" : "left-1"}`} />
                  </button>
                  <span className={`font-bold text-lg ${config.activo ? "text-[var(--white)]" : "text-[var(--muted)]"}`}>
                    {dia.label}
                  </span>
                </div>

                {config.activo ? (
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <Clock className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
                      <input
                        type="time"
                        value={config.abre || ""}
                        onChange={(e) => handleUpdate(dia.id, "abre", e.target.value)}
                        className="bg-[var(--dark)] border border-white/5 rounded-lg px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[var(--gold)] w-full sm:w-auto"
                      />
                    </div>
                    <span className="text-[var(--muted)] text-sm">a</span>
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                      <input
                        type="time"
                        value={config.cierra || ""}
                        onChange={(e) => handleUpdate(dia.id, "cierra", e.target.value)}
                        className="bg-[var(--dark)] border border-white/5 rounded-lg px-3 py-2 text-sm text-[var(--white)] outline-none focus:border-[var(--gold)] w-full sm:w-auto"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-[var(--muted)] italic">
                    <XCircle className="w-4 h-4" />
                    Cerrado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
