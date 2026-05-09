"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { UserPlus, Trash2, Shield, Scissors, Mail, Loader2 } from "lucide-react";
import { Usuario } from "@/types/firebase";

export default function BarberosPage() {
  const { user } = useAuth();
  const [barberos, setBarberos] = useState<Usuario[]>([]);
  const [pendientes, setPendientes] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newBarberoEmail, setNewBarberoEmail] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user?.barberia_id) {
      cargarBarberos(user.barberia_id);
    }
  }, [user?.barberia_id]);

  const cargarBarberos = async (barberiaId: string) => {
    try {
      const users = await userService.getByBarberia(barberiaId);
      const barbs = users.filter(u => u.role === "barbero");
      setBarberos(barbs.filter(b => b.activo));
      setPendientes(barbs.filter(b => !b.activo));
    } catch (e) {
      console.error(e);
      setError("Error al cargar barberos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBarbero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.barberia_id || !newBarberoEmail) return;
    
    setAdding(true);
    setError("");
    
    try {
      // In a real flow, this would call an API to find the user by email
      // and assign them the barbero role + barberia_id
      // For now, let's simulate the API call to set-custom-claims
      
      const res = await fetch("/api/auth/set-custom-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newBarberoEmail, // API should handle lookup by email
          role: "barbero",
          barberia_id: user.barberia_id
        })
      });

      if (!res.ok) throw new Error("No se pudo añadir al barbero. ¿Existe el usuario?");

      setNewBarberoEmail("");
      setShowModal(false);
      cargarBarberos(user.barberia_id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBarbero = async (barbero: Usuario) => {
    if (!confirm(`¿Estás seguro de que quieres quitar a ${barbero.nombre || barbero.email} del equipo?`)) return;
    
    try {
      // Regresamos al usuario a rol 'usuario' y quitamos la barberia_id
      await userService.update(barbero.uid, {
        role: "usuario",
        barberia_id: null,
        activo: false
      });
      cargarBarberos(user!.barberia_id!);
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar al barbero");
    }
  };

  const handleToggleStatus = async (barbero: Usuario) => {
    try {
      await userService.update(barbero.uid, {
        activo: !barbero.activo
      });
      cargarBarberos(user!.barberia_id!);
    } catch (e) {
      console.error(e);
      setError("No se pudo cambiar el estado del barbero");
    }
  };

  const handleAceptarBarbero = async (barbero: Usuario) => {
    try {
      await userService.update(barbero.uid, { activo: true });
      cargarBarberos(user!.barberia_id!);
    } catch (e) {
      console.error(e);
      setError("No se pudo aceptar al barbero");
    }
  };

  const handleRechazarBarbero = async (barbero: Usuario) => {
    if (!confirm(`¿Estás seguro de que quieres rechazar a ${barbero.nombre || barbero.email}?`)) return;
    try {
      await userService.update(barbero.uid, { 
        role: "usuario", 
        barberia_id: null,
        activo: true // Regresa a ser usuario normal activo
      });
      cargarBarberos(user!.barberia_id!);
    } catch (e) {
      console.error(e);
      setError("No se pudo rechazar al barbero");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Barberos</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Gestiona el equipo de trabajo de tu barbería
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5" />
          Añadir Barbero
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Solicitudes Pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-[var(--gold)] uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Solicitudes de Validación ({pendientes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendientes.map((p) => (
              <div key={p.uid} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--white)]">{p.nombre || "Sin nombre"}</p>
                    <p className="text-xs text-[var(--muted)]">{p.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRechazarBarbero(p)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAceptarBarbero(p)}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 transition-colors"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <h2 className="text-lg font-black text-[var(--white)] uppercase tracking-widest mb-4">Equipo Validado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barberos.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[var(--card)] border border-dashed border-[rgba(201,168,76,0.18)]">
            <Scissors className="w-12 h-12 mx-auto mb-4 text-[var(--muted)] opacity-20" />
            <p className="text-[var(--muted)]">No has añadido barberos todavía</p>
          </div>
        ) : (
          barberos.map((barbero) => (
            <div key={barbero.uid} className="p-6 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] hover:border-[var(--gold)] transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--gold)]/10 flex items-center justify-center text-[var(--gold)] relative">
                  {barbero.foto_url ? (
                    <img src={barbero.foto_url} alt={barbero.nombre} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Scissors className="w-6 h-6" />
                  )}
                  {!barbero.activo && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[var(--card)]" />
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteBarbero(barbero)}
                  className="text-[var(--muted)] hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-bold text-[var(--white)] text-lg">{barbero.nombre || "Barbero sin nombre"}</h3>
              <div className="flex items-center gap-2 text-sm text-[var(--muted)] mt-1">
                <Mail className="w-4 h-4" />
                {barbero.email}
              </div>
              
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-[rgba(201,168,76,0.05)]">
                <button 
                  onClick={() => handleToggleStatus(barbero)}
                  className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                    barbero.activo ? "text-green-500 hover:text-green-400" : "text-amber-500 hover:text-amber-400"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  {barbero.activo ? "Validado / Activo" : "Pendiente / Inactivo"}
                </button>
                <div className="text-xs text-[var(--gold)] font-bold">
                  {barbero.activo ? "En línea" : "Off"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

      {/* Modal - Añadir Barbero */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl">
            <h2 className="text-xl font-black text-[var(--gold)] mb-2">Nuevo Barbero</h2>
            <p className="text-[var(--muted)] text-sm mb-6">
              Ingresa el correo electrónico del usuario para asignarle el rol de Barbero en tu negocio.
            </p>
            
            <form onSubmit={handleAddBarbero} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--muted)] uppercase tracking-wider mb-1">Email del Usuario</label>
                <input
                  type="email"
                  required
                  value={newBarberoEmail}
                  onChange={(e) => setNewBarberoEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-colors"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[rgba(201,168,76,0.1)] text-[var(--muted)] font-bold hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
