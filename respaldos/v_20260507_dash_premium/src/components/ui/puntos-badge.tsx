"use client";

import { formatPrecio } from "@/lib/utils";

interface PuntosBadgeProps {
  puntos: number;
  editable?: boolean;
}

export function PuntosBadge({ puntos, editable = false }: PuntosBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20">
      <svg className="w-4 h-4 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-sm font-bold text-[var(--gold)]">{puntos.toLocaleString("es-MX")}</span>
      {editable && (
        <span className="text-xs text-[var(--muted)]">pts</span>
      )}
    </div>
  );
}

interface PuntosCardProps {
  puntos: number;
  siguienteRecompensa?: string;
  puntosParaSiguiente?: number;
}

export function PuntosCard({ puntos, siguienteRecompensa, puntosParaSiguiente }: PuntosCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--gold)]/10 to-[var(--gold)]/5 border border-[var(--gold)]/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Puntos acumulados</p>
        <svg className="w-5 h-5 text-[var(--gold)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
      <p className="text-3xl font-black text-[var(--gold)]">{puntos.toLocaleString("es-MX")}</p>
      {siguienteRecompensa && puntosParaSiguiente && (
        <div className="mt-3 pt-3 border-t border-[var(--gold)]/10">
          <p className="text-xs text-[var(--muted)]">
            Siguiente: <span className="text-[var(--gold)] font-semibold">{siguienteRecompensa}</span>
          </p>
          <div className="mt-1.5 w-full bg-[var(--dark)] rounded-full h-1.5">
            <div
              className="bg-[var(--gold)] rounded-full h-1.5 transition-all"
              style={{ width: `${Math.min(100, (puntos / puntosParaSiguiente) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">{puntosParaSiguiente - puntos} pts para desbloquear</p>
        </div>
      )}
    </div>
  );
}