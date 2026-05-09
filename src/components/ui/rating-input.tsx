"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  citaId: string;
  barberiaId: string;
  onCalificado: () => void;
}

export function RatingInput({ citaId, barberiaId, onCalificado }: RatingInputProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviarCalificacion = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/barberias/${barberiaId}/citas/${citaId}/calificar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await (await import("firebase/auth")).getAuth().currentUser?.getIdToken()}`,
          },
          body: JSON.stringify({ calificacion: rating, comentario }),
        }
      );
      if (res.ok) {
        setEnviado(true);
        onCalificado();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="text-center py-4">
        <p className="text-[var(--gold)] font-bold text-lg">¡Gracias por tu calificación!</p>
        <div className="flex justify-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={24} className="text-[var(--gold)] fill-[var(--gold)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)] text-center">¿Cómo fue tu experiencia?</p>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`transition-all ${
              n <= (hover || rating)
                ? "text-[var(--gold)] scale-110"
                : "text-[var(--muted)]/30 hover:text-[var(--gold)]/50"
            }`}
          >
            <Star size={32} fill={n <= (hover || rating) ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)"
        className="w-full px-3 py-2 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] placeholder:text-[var(--muted)] text-sm resize-none h-20"
      />
      <button
        onClick={enviarCalificacion}
        disabled={rating === 0 || loading}
        className="w-full py-2.5 rounded-xl bg-[var(--gold)] text-[var(--dark)] font-black text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  );
}