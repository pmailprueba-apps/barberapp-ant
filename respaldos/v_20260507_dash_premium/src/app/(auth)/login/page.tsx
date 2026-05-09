"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Role } from "@/types/roles";

export default function LoginPage() {
  const { user, login, register, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (!loading && user) {
      if (user.role) {
        const redirectMap: Record<Role, string> = {
          superadmin: "/superadmin",
          admin: "/admin/dashboard",
          cliente: "/usuario",
          barbero: "/barbero/dashboard",
          usuario: "/usuario",
        };
        router.push(redirectMap[user.role]);
      } else {
        router.push("/seleccionar-rol");
      }
    }
  }, [user, loading, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!nombre) {
          setError("El nombre es obligatorio.");
          return;
        }
        await register(email, password, nombre);
      }
      router.push("/seleccionar-rol");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      console.error("Auth error:", firebaseError);
      switch (firebaseError.code) {
        case "auth/user-not-found":
          setError("Usuario no encontrado. Verifica tu email.");
          break;
        case "auth/wrong-password":
          setError("Contraseña incorrecta.");
          break;
        case "auth/invalid-email":
          setError("Email inválido.");
          break;
        case "auth/email-already-in-use":
          setError("El email ya está en uso.");
          break;
        case "auth/weak-password":
          setError("La contraseña es muy débil.");
          break;
        default:
          setError(firebaseError.code ? `Error (${firebaseError.code}): Intenta de nuevo.` : "Error al procesar la solicitud.");
      }
    }
  };

  const handleGoogleAuth = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginWithGoogle();
      router.push("/seleccionar-rol");
    } catch (err: unknown) {
      const googleError = err as { code?: string; message?: string };
      console.error("Google auth error:", googleError);
      switch (googleError.code) {
        case "auth/popup-closed-by-user":
          setError("Ventana cerrada. Intenta de nuevo.");
          break;
        case "auth/unauthorized-domain":
          setError("Dominio no autorizado. Contacta al administrador.");
          break;
        case "auth/network-request-failed":
          setError("Error de red. Verifica tu conexión.");
          break;
        default:
          setError("Error con Google: " + (googleError.message || "intenta de nuevo"));
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--dark)] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[var(--gold)]/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--gold)]/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-[var(--card)] border border-[rgba(201,168,76,0.12)] shadow-2xl relative z-10 mx-4">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-3xl bg-[var(--gold)]/10 mb-4">
            <h1 className="text-4xl font-black text-[var(--gold)] tracking-tighter">
              B
            </h1>
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--white)] mb-2">
            {mode === "login" ? "¡Bienvenido de nuevo!" : "Crea tu cuenta"}
          </h2>
          <p className="text-[var(--muted)] text-sm font-medium">
            {mode === "login" ? "Ingresa para gestionar tu barbería" : "Únete a la mejor red de barberías"}
          </p>
        </div>

        {/* Official Google Button - Refined for "Verification" look */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl bg-white text-[#1f1f1f] font-semibold flex items-center justify-center gap-3 hover:bg-[#f8f8f8] transition-all border border-[#dadce0] shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50"
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-full h-full" style={{ width: '20px', height: '20px' }}>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <span className="text-sm tracking-tight font-medium">Continuar con Google</span>
        </button>

        <div className="flex justify-center items-center gap-1.5 mt-4 opacity-40">
          <svg className="w-3 h-3 text-[var(--muted)]" viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">Verificado por Google Cloud</span>
        </div>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-[1px] bg-[rgba(201,168,76,0.12)]" />
          <span className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest">o usa tu email</span>
          <div className="flex-1 h-[1px] bg-[rgba(201,168,76,0.12)]" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          {mode === "register" && (
            <div>
              <label className="block text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.08)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none transition-all placeholder:text-[var(--muted)]/30"
                placeholder="Juan Pérez"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.08)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none transition-all placeholder:text-[var(--muted)]/30"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-2 ml-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-[var(--dark)] border border-[rgba(201,168,76,0.08)] text-[var(--white)] focus:border-[var(--gold)] focus:outline-none transition-all placeholder:text-[var(--muted)]/30"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[var(--gold)]/10 disabled:opacity-50"
          >
            {loading ? "Procesando..." : mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[var(--muted)] font-medium">
          {mode === "login" ? (
            <>
              ¿Eres nuevo?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-[var(--gold)] font-bold hover:underline"
              >
                Regístrate gratis
              </button>
            </>
          ) : (
            <>
              ¿Ya eres miembro?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-[var(--gold)] font-bold hover:underline"
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
