"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { User, Mail, Shield, Calendar, Phone, MapPin, Camera, Save, X, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function PerfilPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  });

  useEffect(() => {
    if (user?.uid) {
      cargarDatosFirestore();
    }
  }, [user?.uid]);

  const cargarDatosFirestore = async () => {
    try {
      const data = await userService.getById(user!.uid);
      setUserData(data);
      setFormData({
        nombre: data?.nombre || user?.displayName || "",
        telefono: data?.telefono || "",
        direccion: data?.direccion || "",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    setLoading(true);
    
    const updateTask = async () => {
      try {
        // 1. Actualizar en Firebase Auth (DisplayName)
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: formData.nombre
          });
        }

        // 2. Actualizar en Firestore
        await userService.set(user.uid, {
          nombre: formData.nombre,
          telefono: formData.telefono,
          direccion: formData.direccion,
        });

        setIsEditing(false);
        await cargarDatosFirestore();
        return "Perfil actualizado correctamente";
      } catch (err: any) {
        throw new Error(err.message || "Error al actualizar");
      } finally {
        setLoading(false);
      }
    };

    toast.promise(updateTask(), {
      loading: "Guardando cambios...",
      success: (data) => data,
      error: (err) => "Error: " + err.message,
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-[var(--white)]">Mi Perfil</h1>
        <p className="text-sm text-[var(--muted)]">Información personal y de contacto</p>
      </div>

      {/* Profile Header Card */}
      <div className="p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <User size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-700 p-1">
              <div className="w-full h-full rounded-full bg-[var(--dark)] flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-[var(--gold)]" />
                )}
              </div>
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-[var(--gold)] text-[var(--dark)] rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera size={14} />
            </button>
          </div>

          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-black text-[var(--white)]">{userData?.nombre || user?.displayName || "Cliente"}</h2>
            <p className="text-[var(--gold)] font-bold text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mt-1">
              <Shield size={14} />
              Membresía Classic
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--gold)]">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Email</p>
            <p className="text-[var(--white)] font-medium">{user?.email}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--gold)]">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Miembro desde</p>
            <p className="text-[var(--white)] font-medium">
              {userData?.creado_en ? new Date(userData.creado_en.seconds * 1000).toLocaleDateString() : "Mayo 2026"}
            </p>
          </div>
        </div>

        <div className={`p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 ${!userData?.telefono && 'opacity-50'}`}>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--gold)]">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Teléfono</p>
            <p className="text-[var(--white)] font-medium">
              {userData?.telefono || "No especificado"}
            </p>
          </div>
        </div>

        <div className={`p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 ${!userData?.direccion && 'opacity-50'}`}>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[var(--gold)]">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)]">Ubicación</p>
            <p className="text-[var(--white)] font-medium">
              {userData?.direccion || "No especificada"}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5">
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white/5 text-[var(--white)] font-black text-sm hover:bg-white/10 transition-all border border-white/10"
        >
          Editar información básica
        </button>
      </div>

      {/* Modal de Edición */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] border border-[rgba(201,168,76,0.2)] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-[var(--white)] uppercase tracking-wider">Editar Perfil</h2>
              <button onClick={() => setIsEditing(false)} className="text-[var(--muted)] hover:text-[var(--white)]">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--muted)] ml-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--muted)] ml-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--muted)] ml-1">Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl bg-[var(--dark)] border border-white/5 text-[var(--white)] focus:border-[var(--gold)] outline-none transition-all"
                    placeholder="Ciudad, País"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/5 text-[var(--white)] font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
