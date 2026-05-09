"use client";

import { useAuth } from "@/hooks/useAuth";
import { QrCode } from "lucide-react";

export default function ClienteQRPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[var(--white)]">Mi QR</h1>

      <div className="bg-[var(--card)] p-8 rounded-2xl border border-[rgba(201,168,76,0.12)] text-center">
        <QrCode className="w-48 h-48 mx-auto mb-6 text-[var(--gold)]" />
        <h2 className="text-xl font-bold text-[var(--white)] mb-2">Código de Cliente</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Muestra este código en la barbería para registrar tu visita y acumular puntos.
        </p>
        <div className="inline-block px-4 py-2 rounded-lg bg-[var(--dark)] border border-[rgba(201,168,76,0.15)]">
          <p className="text-xs text-[var(--muted)] font-mono">{user?.uid}</p>
        </div>
      </div>

      <div className="bg-[var(--card)] p-6 rounded-2xl border border-[rgba(201,168,76,0.12)]">
        <h3 className="font-bold text-[var(--white)] mb-3">¿Cómo funciona?</h3>
        <ul className="space-y-2 text-sm text-[var(--muted)]">
          <li>1. Muestra tu QR al entrar a la barbería</li>
          <li>2. El barbero escanea tu código</li>
          <li>3. Tu visita se registra automáticamente</li>
          <li>4. Acumula puntos con cada visita</li>
        </ul>
      </div>
    </div>
  );
}
