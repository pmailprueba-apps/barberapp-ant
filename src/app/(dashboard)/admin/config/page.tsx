"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { barberiaService } from "@/services/barberiaService";
import { userService } from "@/services/userService";
import { Save, Building2, MapPin, Phone, Globe, Clock, Loader2, HelpCircle } from "lucide-react";

export default function ConfigPage() {
  const { user, refreshUserClaims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSlugHelp, setShowSlugHelp] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    slug: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    logo_url: "",
    web: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    dias_anticipacion: 5,
    margen_reserva_minutos: 30,
  });

  useEffect(() => {
    if (user?.barberia_id) {
      cargarBarberia(user.barberia_id);
    } else {
      setLoading(false);
    }
  }, [user?.barberia_id]);

  const cargarBarberia = async (id: string) => {
    try {
      const data = await barberiaService.getById(id);
      if (data) {
        setFormData({
          nombre: data.nombre || "",
          slug: data.slug || "",
          direccion: data.direccion || "",
          telefono: data.telefono || "",
          descripcion: data.descripcion || "",
          logo_url: data.logo_url || "",
          web: data.web || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          tiktok: data.tiktok || "",
          dias_anticipacion: data.dias_anticipacion || 5,
          margen_reserva_minutos: data.margen_reserva_minutos || 30,
        });
      }
    } catch (e) {
      console.error(e);
      setError("Error al cargar los datos de la barbería");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (user.barberia_id) {
        // Update existing
        await barberiaService.update(user.barberia_id, formData);
        setSuccess("Configuración guardada correctamente");
      } else {
        // Create new
        const newBarberia = await barberiaService.create({
          ...formData,
          admin_uid: user.uid,
          estado: "pendiente",
        });

        // Update user's barberia_id in custom claims via API
        const token = await user.getIdToken();
        await fetch("/api/auth/set-custom-claims", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            role: "admin", 
            barberia_id: newBarberia.id,
            uid: user.uid 
          }),
        });

        // Update user in Firestore
        await userService.set(user.uid, { barberia_id: newBarberia.id });

        await refreshUserClaims();
        setSuccess("Barbería creada con éxito. Refrescando datos...");
        window.location.reload(); // Force reload to pick up new claims
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Error al guardar la configuración");
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--white)]">Configuración</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Gestiona la información pública de tu barbería
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Info */}
          <div className="space-y-8 p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-center gap-3 text-[var(--gold)] mb-2">
              <div className="p-2 rounded-lg bg-[var(--gold)]/10">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Información General</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-2">Nombre de la Barbería</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                  placeholder="Ej: Golden Scissors"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em]">Tu Link de Reservas</label>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowSlugHelp(!showSlugHelp);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-all active:scale-95 group"
                  >
                    <HelpCircle className="w-4 h-4 group-hover:animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Ayuda</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-1 pl-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] focus-within:border-[var(--gold)] transition-all">
                      <span className="text-[var(--muted)] text-sm font-medium select-none whitespace-nowrap">/b/</span>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onFocus={() => setShowSlugHelp(true)}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                        className="min-w-[150px] flex-1 bg-transparent py-3 pr-4 text-[var(--white)] outline-none"
                        placeholder="nombre-de-tu-barberia"
                      />
                    </div>

                    {/* Tooltip Dinámico - Versión Ultra-Visible */}
                    {showSlugHelp && (
                      <div 
                        className="absolute left-0 top-full mt-2 w-full sm:w-[350px] bg-[#FFD700] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-2 border-black"
                        style={{ zIndex: 9999, display: 'block' }}
                      >
                        {/* Triángulo */}
                        <div className="absolute -top-2 left-6 w-4 h-4 bg-[#FFD700] rotate-45 border-l-2 border-t-2 border-black" />
                        
                        <div className="p-4 relative">
                          <div className="flex items-start gap-3">
                            <div className="bg-black/10 p-2 rounded-lg">
                              <Globe className="w-5 h-5 text-black" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-black text-black mb-1 uppercase tracking-tight">
                                ¡Tu Link de Reservas!
                              </h4>
                              <p className="text-[11px] font-bold text-black/80 leading-relaxed mb-3">
                                Este es el nombre que verán tus clientes. Elige algo corto y profesional para tu barbería.
                              </p>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSlugHelp(false);
                                }}
                                className="w-full py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black/80 transition-colors"
                              >
                                Cerrar Aviso
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-[var(--muted)] pl-2 break-all leading-relaxed">
                    Comparte este link: <br className="sm:hidden" />
                    <span className="text-[var(--gold)] font-bold">barberapp-ant-2026.vercel.app/b/{formData.slug || "..."}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-2">Descripción</label>
                <textarea
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all resize-none focus:ring-4 focus:ring-[var(--gold)]/5"
                  placeholder="Cuéntale a tus clientes sobre tu negocio, tu estilo y tu experiencia..."
                />
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="space-y-8 p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl rounded-full -mr-16 -mt-16" />

            <div className="flex items-center gap-3 text-[var(--gold)] mb-2">
              <div className="p-2 rounded-lg bg-[var(--gold)]/10">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Contacto y Ubicación</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-2">Dirección Física</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 w-5 h-5 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors" />
                  <input
                    type="text"
                    required
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                    placeholder="Calle Principal #123, Ciudad"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-2">Teléfono de Contacto</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-4 w-5 h-5 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors" />
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-2">Redes Sociales (Instagram/TikTok/Facebook)</label>
                <div className="space-y-4">
                  {/* Web / Instagram */}
                    <div className="relative group">
                      <Globe className="absolute left-4 top-4 w-5 h-5 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors" />
                      <input
                        type="url"
                        value={formData.web}
                        onChange={(e) => setFormData({ ...formData, web: e.target.value })}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                        placeholder="Sitio Web (opcional)"
                      />
                    </div>

                    {/* Instagram */}
                    <div className="relative group">
                      <div className="absolute left-4 top-4 text-[var(--muted)] group-focus-within:text-[#E4405F] transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                        placeholder="https://instagram.com/tuperfil"
                      />
                    </div>

                  {/* Facebook */}
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                      placeholder="https://facebook.com/tubarberia"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="relative group">
                    <div className="absolute left-4 top-4 text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31 0 2.59.51 3.53 1.45.63.63 1.1 1.41 1.36 2.27.76-.1 1.54-.08 2.29.08.13.03.26.06.39.1.04.1.08.2.1.3v3.66c-.34-.14-.7-.24-1.07-.3-.66-.11-1.34-.06-1.99.16-.14.05-.28.11-.42.18-.53.28-.97.7-1.25 1.21-.19.34-.31.72-.34 1.11-.05.69.17 1.39.63 1.91.44.5 1.05.82 1.7.89.65.07 1.31-.09 1.87-.45.14-.09.27-.2.39-.32.02.1.04.21.05.32v3.91c-.48.24-.99.43-1.52.55-1.05.24-2.14.2-3.17-.11-1.08-.32-2.03-.98-2.72-1.89-.69-.9-1.08-2.01-1.12-3.15-.05-1.39.46-2.74 1.42-3.73.91-.95 2.16-1.51 3.47-1.56V0l-.06.01c-.11-.01-.22-.01-.33-.01-1.36-.01-2.69.41-3.8 1.21-1.11.8-1.92 1.93-2.31 3.23-.39 1.31-.31 2.71.24 3.96.55 1.25 1.54 2.27 2.78 2.89.14.07.28.13.43.19v3.91c-.13-.03-.26-.06-.39-.1-1.28-.43-2.4-1.26-3.17-2.36-.78-1.1-1.17-2.42-1.11-3.76.06-1.31.54-2.58 1.38-3.6.84-1.02 1.99-1.74 3.26-2.05.14-.03.28-.06.42-.08V.02z"/>
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.1)] text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all focus:ring-4 focus:ring-[var(--gold)]/5"
                      placeholder="https://tiktok.com/@tubarberia"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Configuration */}
        <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="flex items-center gap-3 text-[var(--gold)] mb-6">
            <div className="p-2 rounded-lg bg-[var(--gold)]/10">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Configuración de Reservas</h2>
          </div>

          <div className="max-w-md">
            <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-3">Días de anticipación permitidos</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={formData.dias_anticipacion}
                onChange={(e) => setFormData({ ...formData, dias_anticipacion: parseInt(e.target.value) })}
                className="flex-1 accent-[var(--gold)]"
              />
              <div className="w-16 h-12 flex items-center justify-center rounded-xl bg-[var(--dark)] border border-[var(--gold)]/20 text-[var(--gold)] font-black text-xl">
                {formData.dias_anticipacion}
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-4 leading-relaxed uppercase tracking-wider font-medium">
              Los clientes podrán agendar citas hasta <span className="text-[var(--gold)] font-bold">{formData.dias_anticipacion} días</span> después de la fecha actual.
            </p>
          </div>

          <div className="max-w-md mt-8 pt-8 border-t border-white/5">
            <label className="block text-[10px] text-[var(--muted)] uppercase font-black tracking-[0.2em] mb-3">Antelación mínima (mismo día)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="120"
                step="15"
                value={formData.margen_reserva_minutos}
                onChange={(e) => setFormData({ ...formData, margen_reserva_minutos: parseInt(e.target.value) })}
                className="flex-1 accent-[var(--gold)]"
              />
              <div className="w-20 h-12 flex items-center justify-center rounded-xl bg-[var(--dark)] border border-[var(--gold)]/20 text-[var(--gold)] font-black text-xl">
                {formData.margen_reserva_minutos}m
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-4 leading-relaxed uppercase tracking-wider font-medium">
              Para citas hoy, el cliente debe agendar con al menos <span className="text-[var(--gold)] font-bold">{formData.margen_reserva_minutos} minutos</span> de anticipación.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {user?.barberia_id ? "Guardar Cambios" : "Crear Barbería"}
          </button>
        </div>
      </form>
    </div>
  );
}
