"use client";

import { useEffect, useState } from "react";
import { barberiaService } from "@/services/barberiaService";
import { Barberia } from "@/types/firebase";
import Link from "next/link";

export default function SuperAdminBarberias() {
  const [barberias, setBarberias] = useState<Barberia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadBarberias();
  }, []);

  const loadBarberias = async () => {
    try {
      const data = await barberiaService.getAll();
      setBarberias(data);
    } catch (error) {
      console.error("Error loading barberias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivar = async (id: string) => {
    if (!confirm("¿Deseas activar esta barbería?")) return;
    try {
      await barberiaService.update(id, { estado: "activa" });
      loadBarberias();
    } catch (error) {
      console.error("Error activating barberia:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gold-text-gradient">Gestión de Barberías</h1>
          <p className="text-[var(--muted)]">Administra los negocios registrados en la plataforma.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--gold)] text-[var(--dark)] px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2"
        >
          <span>➕</span> Nueva Barbería
        </button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-[rgba(201,168,76,0.1)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[rgba(201,168,76,0.05)] border-b border-[rgba(201,168,76,0.1)]">
              <th className="px-6 py-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wider">Barbería</th>
              <th className="px-6 py-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wider">Slug</th>
              <th className="px-6 py-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wider">Plan</th>
              <th className="px-6 py-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-sm font-bold text-[var(--gold)] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,168,76,0.1)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                  Cargando barberías...
                </td>
              </tr>
            ) : barberias.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                  No hay barberías registradas.
                </td>
              </tr>
            ) : (
              barberias.map((b) => (
                <tr key={b.id} className="hover:bg-[rgba(201,168,76,0.02)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[rgba(201,168,76,0.1)] flex items-center justify-center text-xl">
                        {b.logo ? <img src={b.logo} alt={b.nombre} className="w-full h-full rounded-full object-cover" /> : "💈"}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--white)]">{b.nombre}</div>
                        <div className="text-xs text-[var(--muted)]">{b.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-[var(--dark)] px-2 py-1 rounded border border-[rgba(201,168,76,0.1)] text-[var(--gold)]">
                      /{b.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-[rgba(201,168,76,0.1)] text-[var(--gold)] uppercase">
                      {b.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      b.estado === 'activa' ? 'bg-green-500/10 text-green-500' : 
                      b.estado === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {b.estado === 'pendiente' ? '⌛ Pendiente' : b.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {b.estado === "pendiente" && (
                        <button
                          onClick={() => handleActivar(b.id!)}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all"
                        >
                          Activar
                        </button>
                      )}
                      <Link
                        href={`/superadmin/barberias/${b.id}`}
                        className="p-2 hover:bg-[rgba(201,168,76,0.1)] rounded-lg transition-colors text-[var(--muted)] hover:text-[var(--gold)]"
                      >
                        ⚙️
                      </Link>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-[var(--muted)] hover:text-red-500">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CreateBarberiaModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            loadBarberias();
          }} 
        />
      )}
    </div>
  );
}

function CreateBarberiaModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    direccion: "",
    telefono: "",
    email: "",
    plan: "basico" as const,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await barberiaService.create({
        ...formData,
        estado: "activa",
        logo: null,
        acceso_admin: true,
        reservas_activas: true,
        horarios: {
          lunes: { abre: "09:00", cierra: "19:00", activo: true },
          martes: { abre: "09:00", cierra: "19:00", activo: true },
          miercoles: { abre: "09:00", cierra: "19:00", activo: true },
          jueves: { abre: "09:00", cierra: "19:00", activo: true },
          viernes: { abre: "09:00", cierra: "20:00", activo: true },
          sabado: { abre: "09:00", cierra: "17:00", activo: true },
          domingo: { abre: null, cierra: null, activo: false },
        },
        servicios: [
          { id: "1", nombre: "Corte Clásico", duracion_min: 30, precio: 150, activo: true },
          { id: "2", nombre: "Barba", duracion_min: 20, precio: 100, activo: true },
        ],
        dias_bloqueados: [],
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating barberia:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[var(--card)] w-full max-w-lg rounded-2xl border border-[rgba(201,168,76,0.2)] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-[rgba(201,168,76,0.1)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--gold)]">Nueva Barbería</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Nombre del Negocio</label>
              <input
                required
                type="text"
                value={formData.nombre}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    nombre: val,
                    slug: val.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  }));
                }}
                className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
                placeholder="Ej. Barbería El Elegante"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Slug (URL)</label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
                placeholder="slug-del-negocio"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Plan</label>
              <select
                value={formData.plan}
                onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value as any }))}
                className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
              >
                <option value="basico">Básico</option>
                <option value="pro">Pro</option>
                <option value="cadena">Cadena</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
                placeholder="contacto@barberia.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Teléfono</label>
              <input
                required
                type="tel"
                value={formData.telefono}
                onChange={e => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
                placeholder="4441234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">Dirección</label>
            <input
              required
              type="text"
              value={formData.direccion}
              onChange={e => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              className="w-full bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] rounded-lg px-4 py-2 text-white focus:border-[var(--gold)] outline-none"
              placeholder="Calle Falsa 123, SLP"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-[rgba(201,168,76,0.1)] text-white hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Barbería"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
