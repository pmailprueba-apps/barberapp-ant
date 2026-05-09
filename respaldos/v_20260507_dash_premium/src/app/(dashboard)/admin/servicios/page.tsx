"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { barberiaService } from "@/services/barberiaService";
import { Plus, Scissors, Clock, DollarSign, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import { Servicio } from "@/types/firebase";
import { formatPrecio } from "@/lib/utils";

export default function ServiciosPage() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Servicio, "id">>({
    nombre: "",
    duracion_min: 30,
    precio: 0,
    activo: true,
  });

  useEffect(() => {
    if (user?.barberia_id) {
      cargarServicios(user.barberia_id);
    }
  }, [user?.barberia_id]);

  const cargarServicios = async (barberiaId: string) => {
    try {
      const barberia = await barberiaService.getById(barberiaId);
      if (barberia?.servicios) {
        setServicios(barberia.servicios);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.barberia_id) return;
    setSaving(true);

    try {
      let nuevosServicios: Servicio[];
      if (editingId) {
        nuevosServicios = servicios.map(s => s.id === editingId ? { ...formData, id: editingId } : s);
      } else {
        const nuevo: Servicio = { ...formData, id: Math.random().toString(36).substr(2, 9) };
        nuevosServicios = [...servicios, nuevo];
      }

      await barberiaService.update(user.barberia_id, { servicios: nuevosServicios });
      setServicios(nuevosServicios);
      resetForm();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.barberia_id || !confirm("¿Eliminar este servicio?")) return;
    try {
      const nuevosServicios = servicios.filter(s => s.id !== id);
      await barberiaService.update(user.barberia_id, { servicios: nuevosServicios });
      setServicios(nuevosServicios);
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (s: Servicio) => {
    setEditingId(s.id);
    setFormData({
      nombre: s.nombre,
      duracion_min: s.duracion_min,
      precio: s.precio,
      activo: s.activo,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nombre: "", duracion_min: 30, precio: 0, activo: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Servicios</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Define los cortes y tratamientos que ofreces</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] sticky top-6">
            <h2 className="text-lg font-bold text-[var(--white)] mb-6 flex items-center gap-2">
              {editingId ? <Edit2 className="w-5 h-5 text-[var(--gold)]" /> : <Plus className="w-5 h-5 text-[var(--gold)]" />}
              {editingId ? "Editar Servicio" : "Nuevo Servicio"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-colors"
                  placeholder="Ej: Corte Clásico"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Precio</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted)]" />
                    <input
                      type="number"
                      required
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Duración (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--muted)]" />
                    <input
                      type="number"
                      required
                      value={formData.duracion_min}
                      onChange={(e) => setFormData({ ...formData, duracion_min: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingId ? "Actualizar" : "Añadir"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-3 rounded-xl border border-[rgba(201,168,76,0.1)] text-[var(--muted)] hover:text-[var(--white)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {servicios.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[rgba(201,168,76,0.18)]">
              <Scissors className="w-12 h-12 mx-auto mb-4 text-[var(--muted)] opacity-20" />
              <p className="text-[var(--muted)]">Aún no has configurado servicios</p>
            </div>
          ) : (
            servicios.map((s) => (
              <div key={s.id} className="p-5 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] flex items-center justify-between group hover:border-[var(--gold)] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)]">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--white)]">{s.nombre}</h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted)] mt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duracion_min} min</span>
                      <span className="flex items-center gap-1 font-bold text-[var(--gold)]"><DollarSign className="w-3 h-3" /> {formatPrecio(s.precio)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--muted)] hover:text-[var(--gold)]">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--muted)] hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
