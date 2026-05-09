"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { 
  User, 
  Mail, 
  Shield, 
  Phone, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  Save,
  Scissors
} from "lucide-react";

export default function PerfilBarberoPage() {
  const { user, refreshUserClaims } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    foto_url: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        telefono: user.telefono || "",
        foto_url: user.foto_url || ""
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await userService.set(user.uid, {
        nombre: formData.nombre,
        telefono: formData.telefono,
        foto_url: formData.foto_url
      });
      
      await refreshUserClaims();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setError("No se pudo actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-black text-[var(--white)]">Mi Perfil Profesional</h1>
        <p className="text-sm text-[var(--muted)]">Gestiona tu información pública para los clientes</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          Perfil actualizado con éxito
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Header Card */}
        <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Scissors size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-700 p-1">
                <div className="w-full h-full rounded-full bg-[var(--dark)] flex items-center justify-center overflow-hidden">
                  {formData.foto_url ? (
                    <img src={formData.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-[var(--gold)]" />
                  )}
                </div>
              </div>
              <button 
                type="button"
                className="absolute bottom-0 right-0 p-2 bg-[var(--gold)] text-[var(--dark)] rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-black text-[var(--white)]">{user?.nombre || "Barbero"}</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                <p className="text-[var(--gold)] font-bold text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                  <Shield size={14} />
                  Barbero Activo
                </p>
                {user?.barberia_nombre && (
                  <>
                    <span className="hidden md:inline text-[var(--muted)]">•</span>
                    <p className="text-[var(--muted)] font-semibold text-sm flex items-center justify-center md:justify-start gap-2">
                      <Scissors size={14} className="text-[var(--gold)]" />
                      {user.barberia_nombre}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="text-xs text-[var(--muted)] uppercase font-black tracking-widest flex items-center gap-2">
              <User size={14} className="text-[var(--gold)]" />
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--muted)] uppercase font-black tracking-widest flex items-center gap-2">
              <Phone size={14} className="text-[var(--gold)]" />
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
              placeholder="+52 ..."
            />
          </div>

          <div className="space-y-2 opacity-60">
            <label className="text-xs text-[var(--muted)] uppercase font-black tracking-widest flex items-center gap-2">
              <Mail size={14} />
              Correo Electrónico (No editable)
            </label>
            <div className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/5 text-[var(--muted)]">
              {user?.email}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Perfil Profesional
          </button>
        </div>
      </form>
    </div>
  );
}
