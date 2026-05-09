"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ClienteCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  servicioNombre: string;
  barberoNombre: string;
  fecha: string;
  hora: string;
}

export function ClienteCancelModal({
  isOpen,
  onClose,
  onConfirm,
  servicioNombre,
  barberoNombre,
  fecha,
  hora,
}: ClienteCancelModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    onClose();
    setReason("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancelar Cita">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--red)]/10 border border-[var(--red)]/20">
          <AlertTriangle className="w-5 h-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[var(--white)]">{servicioNombre}</p>
            <p className="text-sm text-[var(--muted)]">Con {barberoNombre}</p>
            <p className="text-sm text-[var(--gold)]">{fecha} - {hora}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-2">
            ¿Por qué cancelas? (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Ya no puedo asistir, cambio de planes..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:border-[var(--gold)] transition-colors"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Volver
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            className="flex-1"
          >
            Confirmar Cancelación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
