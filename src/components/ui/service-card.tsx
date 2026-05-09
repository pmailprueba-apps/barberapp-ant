"use client";

import { useState } from "react";
import { formatPrecio } from "@/lib/utils";

interface ServicioCardProps {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_min: number;
  activo: boolean;
  onToggle: (id: string, activo: boolean) => Promise<void>;
  onUpdate: (id: string, data: { precio?: number; duracion_min?: number }) => Promise<void>;
}

export function ServicioCard({
  id,
  nombre,
  descripcion,
  precio,
  duracion_min,
  activo,
  onToggle,
  onUpdate,
}: ServicioCardProps) {
  const [editing, setEditing] = useState(false);
  const [localPrecio, setLocalPrecio] = useState(precio);
  const [localDuracion, setLocalDuracion] = useState(duracion_min);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    await onToggle(id, !activo);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(id, { precio: localPrecio, duracion_min: localDuracion });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all ${
        activo
          ? "bg-[var(--card)] border-[rgba(201,168,76,0.18)]"
          : "bg-[var(--card)] border-[rgba(201,168,76,0.08)] opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[var(--white)]">{nombre}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{descripcion}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${
            activo ? "bg-[var(--teal)]" : "bg-[var(--muted)]"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              activo ? "left-7" : "left-1"
            }`}
          />
        </button>
      </div>

      {activo && (
        <div className="mt-4 pt-4 border-t border-[rgba(201,168,76,0.1)]">
          {editing ? (
            <div className="flex gap-4 items-end">
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">Precio MXN</label>
                <input
                  type="number"
                  value={localPrecio}
                  onChange={(e) => setLocalPrecio(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.18)] text-[var(--white)] text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">Duración (min)</label>
                <input
                  type="number"
                  value={localDuracion}
                  onChange={(e) => setLocalDuracion(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.18)] text-[var(--white)] text-sm"
                  min={5}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--gold)] text-[var(--dark)] font-bold text-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "..." : "Guardar"}
              </button>
              <button
                onClick={() => {
                  setLocalPrecio(precio);
                  setLocalDuracion(duracion_min);
                  setEditing(false);
                }}
                className="px-4 py-2 rounded-lg border border-[rgba(201,168,76,0.18)] text-[var(--muted)] text-sm hover:text-[var(--white)]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-[var(--muted)]">Precio</p>
                  <p className="text-lg font-bold text-[var(--gold)]">{formatPrecio(precio)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Duración</p>
                  <p className="text-lg font-bold text-[var(--white)]">{duracion_min} min</p>
                </div>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[var(--gold)] hover:underline"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
