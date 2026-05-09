"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BarberiaData {
  id: string;
  nombre: string;
  logo: string | null;
  direccion: string;
  telefono: string;
  horarios?: Record<string, { abre: string | null; cierra: string | null; activo: boolean }>;
}

export default function BarberiaLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [barberia, setBarberia] = useState<BarberiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    cargarBarberia();
  }, [slug]);

  const cargarBarberia = async () => {
    try {
      const res = await fetch(`/api/barberias/por-slug/${slug}`);
      if (!res.ok) {
        setError("Barbería no encontrada");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setBarberia(data);
    } catch (e) {
      setError("Error al cargar la barbería");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !barberia) {
    return (
      <div className="min-h-screen bg-[var(--dark)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--red)]/10 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-[var(--white)] mb-2">Barbería no encontrada</h1>
        <p className="text-[var(--muted)]">El código QR no es válido o la barbería ya no existe.</p>
      </div>
    );
  }

  const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const HOY = DIAS[new Date().getDay()];

  const hacerLlamada = () => {
    window.location.href = `tel:${barberia.telefono}`;
  };

  return (
    <div className="min-h-screen bg-[var(--dark)]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--gold)]/10 to-transparent px-6 pt-12 pb-8">
        {barberia.logo && (
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[var(--gold)]/20 mx-auto mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barberia.logo} alt={barberia.nombre} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-center">
          <h1 className="text-3xl font-black text-[var(--gold)] font-[family-name:var(--font-display)] tracking-wide">
            {barberia.nombre}
          </h1>
          <p className="text-sm text-[var(--muted)] mt-2 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {barberia.direccion}
          </p>
        </div>
      </div>

      {/* Horarios */}
      <div className="px-6 py-6">
        <h2 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-3">Horarios</h2>
        <div className="space-y-2">
          {DIAS.map((dia) => {
            const h = barberia.horarios?.[dia];
            const esHoy = dia === HOY;
            return (
              <div
                key={dia}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  esHoy
                    ? "bg-[var(--gold)]/10 border border-[var(--gold)]/20"
                    : "bg-[var(--card)]"
                }`}
              >
                <span className={`text-sm capitalize font-semibold ${esHoy ? "text-[var(--gold)]" : "text-[var(--white)]"}`}>
                  {dia}
                  {esHoy && (
                    <span className="ml-2 text-xs bg-[var(--gold)] text-[var(--dark)] px-2 py-0.5 rounded-full font-bold">
                      Hoy
                    </span>
                  )}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  {h?.activo && h?.abre && h?.cierra
                    ? `${h.abre} - ${h.cierra}`
                    : "Cerrado"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="px-6 pb-8 space-y-3">
        <button
          onClick={hacerLlamada}
          className="w-full py-4 rounded-2xl bg-[var(--gold)] text-[var(--dark)] font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Llamar ahora
        </button>

        <a
          href={`https://wa.me/${barberia.telefono.replace(/\D/g, "")}?text=Hola, quiero agendar una cita en ${encodeURIComponent(barberia.nombre)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-black text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Reservar por WhatsApp
        </a>

        <a
          href="/login"
          className="w-full py-4 rounded-2xl border border-[var(--gold)]/30 text-[var(--gold)] font-bold text-lg flex items-center justify-center gap-3 hover:bg-[var(--gold)]/5 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Reservar en línea
        </a>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 text-xs text-[var(--muted)]">
        <p>Powered by <span className="text-[var(--gold)] font-semibold">BarberApp</span></p>
      </div>
    </div>
  );
}