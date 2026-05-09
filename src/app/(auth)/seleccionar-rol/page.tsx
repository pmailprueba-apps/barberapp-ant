"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Role } from "@/types/roles";
import { Building2, Scissors, User, Crown } from "lucide-react";
import { userService } from "@/services/userService";
import { useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Barberia } from "@/types/firebase";

const ROLES: { value: Role; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "usuario",
    label: "Usuario",
    desc: "Persona que se corta el cabello",
    icon: <User className="w-8 h-8" />,
  },
  {
    value: "cliente",
    label: "Cliente",
    desc: "Barbería (negocio)",
    icon: <Building2 className="w-8 h-8" />,
  },
  {
    value: "barbero",
    label: "Barbero",
    desc: "Empleado de la barbería",
    icon: <Scissors className="w-8 h-8" />,
  },
  {
    value: "admin",
    label: "Admin",
    desc: "Dueño de la barbería",
    icon: <Building2 className="w-8 h-8" />,
  },
];

export default function SelectorRolPage() {
  const { user, loading, refreshUserClaims, logout } = useAuth();
  const router = useRouter();
  const [seleccionando, setSeleccionando] = useState(false);
  const [error, setError] = useState("");
  const [showBarberiaSelect, setShowBarberiaSelect] = useState(false);
  const [barberias, setBarberias] = useState<Barberia[]>([]);
  const [barberiaId, setBarberiaId] = useState("");

  useEffect(() => {
    const fetchBarberias = async () => {
      const snap = await getDocs(query(collection(db, "barberias"), where("estado", "==", "activa")));
      setBarberias(snap.docs.map(d => ({ id: d.id, ...d.data() } as Barberia)));
    };
    fetchBarberias();
  }, []);

  const redirectMap: Record<Role, string> = {
    superadmin: "/superadmin",
    admin: "/admin/dashboard",
    cliente: "/usuario",
    barbero: "/barbero/dashboard",
    usuario: "/usuario",
  };

  useEffect(() => {
    if (!loading && user?.role) {
      router.push(redirectMap[user.role]);
    }
  }, [user, loading, router]);

  if (!loading && !user) {
    router.push("/login");
    return null;
  }

  const handleSelectRol = async (rol: Role) => {
    if (!user) return;
    
    if (rol === "barbero" && !barberiaId) {
      const snap = await getDocs(query(collection(db, "barberias"), where("estado", "==", "activa")));
      setBarberias(snap.docs.map(d => ({ id: d.id, ...d.data() } as Barberia)));
      setShowBarberiaSelect(true);
      return;
    }

    setSeleccionando(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const claimsBody: any = { role: rol, uid: user.uid };
      if (rol === "barbero" && barberiaId) {
        claimsBody.barberia_id = barberiaId;
      }

      const res = await fetch("/api/auth/set-custom-claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(claimsBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Error asignando rol");
      }

      // Sync with Firestore
      await userService.set(user.uid, {
        email: user.email,
        nombre: user.displayName || "",
        role: rol,
        barberia_id: rol === "barbero" ? barberiaId : null,
        foto_url: user.photoURL || null,
        activo: rol !== "barbero", // Barbero inicia inactivo hasta validación
        puntos: 0,
        ultimo_acceso: new Date()
      });

      await refreshUserClaims();
      router.push(redirectMap[rol]);
    } catch (e: any) {
      console.error("Error al asignar rol:", e);
      setError(`Error: ${e.message || "Intenta de nuevo"}`);
      setSeleccionando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dark)]">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isSuperAdmin = user.role === "superadmin";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--dark)] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[var(--gold)] mb-2">BarberApp</h1>
          <p className="text-[var(--muted)]">
            Hola, {user.displayName || user.email}. Selecciona tu rol:
          </p>
        </div>

        <div className="space-y-4">
          {ROLES.map((rol) => (
            <button
              key={rol.value}
              onClick={() => handleSelectRol(rol.value)}
              disabled={seleccionando}
              className="w-full p-6 rounded-2xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] hover:border-[var(--gold)] transition-colors text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="text-[var(--gold)]">{rol.icon}</div>
                <div>
                  <p className="font-bold text-lg text-[var(--white)]">{rol.label}</p>
                  <p className="text-sm text-[var(--muted)]">{rol.desc}</p>
                </div>
              </div>
            </button>
          ))}

          {isSuperAdmin && (
            <button
              onClick={() => handleSelectRol("superadmin")}
              disabled={seleccionando}
              className="w-full p-6 rounded-2xl bg-gradient-to-r from-[var(--gold)] to-amber-600 hover:opacity-90 transition-opacity text-left disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="text-[var(--dark)]">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-black text-lg text-[var(--dark)]">Super Admin</p>
                  <p className="text-sm text-[var(--dark)] opacity-80">Acceso total a la plataforma</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-[var(--red)]">{error}</p>
        )}

        {/* Modal Selección Barbería para Barbero */}
        {showBarberiaSelect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--card)] border border-[rgba(201,168,76,0.18)] shadow-2xl">
              <h2 className="text-2xl font-black text-[var(--gold)] mb-2">Únete a una Barbería</h2>
              <p className="text-[var(--muted)] text-sm mb-6">
                Selecciona la barbería donde trabajas. Tu cuenta deberá ser validada por el administrador.
              </p>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2">
                {barberias.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBarberiaId(b.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      barberiaId === b.id 
                        ? "bg-[var(--gold)]/10 border-[var(--gold)]" 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold text-[var(--white)]">{b.nombre}</p>
                    <p className="text-xs text-[var(--muted)]">{b.direccion}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBarberiaSelect(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-[var(--muted)] font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={!barberiaId || seleccionando}
                  onClick={() => handleSelectRol("barbero")}
                  className="flex-1 py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {seleccionando ? "..." : "Solicitar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
          className="mt-6 w-full py-3 rounded-lg border border-[rgba(201,168,76,0.18)] text-[var(--muted)] hover:text-[var(--white)] transition-colors text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
