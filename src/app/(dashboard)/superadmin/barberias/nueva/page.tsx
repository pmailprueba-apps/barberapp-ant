"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Store, MapPin, Phone, Mail, Globe } from "lucide-react";
import { toast } from "sonner";

export default function NuevaBarberiaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    ciudad: "San Luis Potosí",
    estado: "SLP",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/barberias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          slug: form.nombre.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          estado: "activa",
          plan: "basico",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/superadmin/barberias/${data.id}`);
      } else {
        toast.error("Error al crear barbería");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-[var(--card)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--white)]" />
        </button>
        <h1 className="text-2xl font-black text-[var(--white)]">Nueva Barbería</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.12)] space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Nombre de la Barbería</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none"
            placeholder="Barbería El Rey"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Dirección</label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none"
            placeholder="Av. Central #123"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Ciudad</label>
            <input type="text" value={form.ciudad} readOnly className="w-full px-4 py-3 rounded-xl bg-[var(--dark)]/50 border border-[rgba(201,168,76,0.1)] text-[var(--muted)]" />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">Estado</label>
            <input type="text" value={form.estado} readOnly className="w-full px-4 py-3 rounded-xl bg-[var(--dark)]/50 border border-[rgba(201,168,76,0.1)] text-[var(--muted)]" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Teléfono</label>
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none"
            placeholder="444 123 4567"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none"
            placeholder="contacto@barberia.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-black hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Creando..." : "Crear Barbería"}
        </button>
      </form>
    </div>
  );
}
