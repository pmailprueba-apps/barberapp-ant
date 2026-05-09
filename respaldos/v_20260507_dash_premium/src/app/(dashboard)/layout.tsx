"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layouts/sidebar";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Barberia } from "@/types/firebase";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [barberiaStatus, setBarberiaStatus] = useState<Barberia["estado"] | "loading">("loading");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user && (user.role === "admin" || user.role === "barbero")) {
      if (user.barberia_id) {
        const checkStatus = async () => {
          try {
            const docRef = doc(db, "barberias", user.barberia_id!);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setBarberiaStatus(docSnap.data().estado);
            } else {
              setBarberiaStatus("pendiente"); // Fallback
            }
          } catch (e) {
            console.error(e);
            setBarberiaStatus("pendiente");
          }
        };
        checkStatus();
      } else {
        // Si es admin o barbero pero aún no tiene ID de barbería, queda bloqueado
        setBarberiaStatus("pendiente");
      }
    } else {
      setBarberiaStatus("activa"); // Clientes, usuarios o superadmin pasan directo
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dark)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted)]">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Bloqueo de Seguridad (Candado)
  if (user.role !== "superadmin" && barberiaStatus === "pendiente") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dark)] p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-[rgba(201,168,76,0.1)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[rgba(201,168,76,0.2)]">
            <svg className="w-10 h-10 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-[var(--white)]">Cuenta en Revisión</h1>
          <p className="text-[var(--muted)] leading-relaxed">
            ¡Gracias por registrar tu barbería! Tu cuenta está siendo revisada por nuestro equipo de seguridad. 
            Recibirás un aviso cuando sea activada por un SuperAdministrador.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => logout()}
              className="px-6 py-2 border border-[rgba(201,168,76,0.3)] text-[var(--gold)] rounded-xl hover:bg-[rgba(201,168,76,0.05)] transition-all font-bold"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (barberiaStatus === "loading" && user.role !== "superadmin") {
     return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--dark)]">
        <div className="w-12 h-12 border-4 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--dark)]">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
