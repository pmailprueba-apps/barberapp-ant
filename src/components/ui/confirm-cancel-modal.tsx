"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  titulo?: string;
  descripcion?: string;
  nombreCliente?: string;
  hora?: string;
}

export function ConfirmCancelModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Cancelar Cita",
  descripcion = "¿Estás seguro de que deseas cancelar esta cita?",
  nombreCliente,
  hora,
}: ConfirmCancelModalProps) {
  const [step, setStep] = useState<"confirm" | "reason">("confirm");
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setStep("confirm");
    setReason("");
    onClose();
  };

  const handleConfirmar = () => {
    onConfirm(reason);
    handleClose();
  };

  const handleNext = () => {
    setStep("reason");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === "confirm" ? titulo : titulo}>
      <div className="space-y-4">
        {step === "confirm" ? (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20">
              <AlertTriangle className="w-5 h-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
              <div>
                {nombreCliente && <p className="font-bold text-[var(--white)]">{nombreCliente}</p>}
                {hora && <p className="text-sm text-[var(--muted)]">{hora}</p>}
                <p className="text-sm text-[var(--white)] mt-1">{descripcion}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={handleNext}
                className="flex-1"
              >
                Sí, Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--red)]/10 border border-[var(--red)]/20">
              <AlertTriangle className="w-5 h-5 text-[var(--red)] flex-shrink-0 mt-0.5" />
              <div>
                {nombreCliente && <p className="font-bold text-[var(--white)]">{nombreCliente}</p>}
                {hora && <p className="text-sm text-[var(--muted)]">{hora}</p>}
                <p className="text-sm text-[var(--white)] mt-1">¿Quieres agregar un motivo? (opcional)</p>
              </div>
            </div>

            <div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Cambio de planes, conflicto de horario..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--dark)] border border-[rgba(201,168,76,0.15)] text-[var(--white)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:border-[var(--gold)] transition-colors"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setStep("confirm")}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmar}
                className="flex-1"
              >
                Confirmar Cancelación
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}