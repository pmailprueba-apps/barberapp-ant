"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

const TEST_ACCOUNTS = [
  { role: "Super Admin", email: "superadmin@prueba.com", pass: "Prueba123!" },
  { role: "Admin", email: "admin@prueba.com", pass: "Prueba123!" },
  { role: "Barbero", email: "barbero@prueba.com", pass: "Prueba123!" },
  { role: "Cliente", email: "cliente@prueba.com", pass: "Prueba123!" },
];

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Removido temporalmente para asegurar que se vea
  // if (process.env.NODE_ENV !== "development") return null;
  if (!isClient) return null;

  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      setIsLoggingIn(true);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error en Quick Login:", error);
      alert("Error: Asegúrate de crear estas cuentas en Firebase Authentication con la contraseña: " + pass);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 font-sans" 
      style={{ 
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 99999,
        display: 'block'
      }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg flex items-center justify-center transition-colors border border-purple-400"
          style={{
            backgroundColor: '#9333ea',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '9999px',
            border: '1px solid #c084fc',
            cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Abrir Dev Tools"
        >
          <span className="text-xl px-2" style={{ fontSize: '1.25rem', padding: '0 0.5rem' }}>🛠️ Usuarios</span>
        </button>
      ) : (
        <div 
          className="bg-[#111] border border-zinc-800 rounded-lg shadow-2xl p-4 w-72 text-sm"
          style={{
            backgroundColor: '#111',
            border: '1px solid #27272a',
            borderRadius: '0.5rem',
            padding: '1rem',
            width: '18rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            color: 'white'
          }}
        >
          <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
            <h3 className="font-bold text-[var(--accent)] flex items-center gap-2">
              <span>🛠️</span> Dev Tools
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 space-y-1">
            <p className="text-zinc-400 text-xs">Entorno actual:</p>
            <div className="bg-zinc-900 p-2 rounded text-xs text-green-400 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {process.env.NODE_ENV}
            </div>
            
            <p className="text-zinc-400 text-xs mt-2">Proyecto Firebase:</p>
            <div className="bg-zinc-900 p-2 rounded text-xs text-blue-400 font-mono truncate">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "No definido"}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <p className="text-zinc-400 text-xs mb-2">
              Estado actual: {loading ? "Cargando..." : (user ? <span className="text-green-400">Logueado ({user.email})</span> : <span className="text-red-400">Sin sesión</span>)}
            </p>

            <div className="space-y-2 mt-3">
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Cambio rápido de cuenta:</p>
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  disabled={isLoggingIn || user?.email === acc.email}
                  className="w-full text-left px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded transition-colors text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex justify-between items-center"
                >
                  <span>{acc.role}</span>
                  {user?.email === acc.email && <span className="text-[10px] text-green-500">Activo</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
