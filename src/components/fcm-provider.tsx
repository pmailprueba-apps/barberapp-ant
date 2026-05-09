"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { obtenerFCMToken, guardarFCMToken } from "@/lib/fcm";

export function useFCMPush() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid || typeof window === "undefined") return;

    const registrarToken = async () => {
      const token = await obtenerFCMToken();
      if (token) {
        await guardarFCMToken(user.uid, token);
      }
    };

    registrarToken();
  }, [user?.uid]);
}

/**
 * Componente Provider que se agrega al layout para registrar FCM al cargar la app.
 * Solo se ejecuta en el cliente, solo una vez.
 */
export function FCMProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const registrar = async () => {
      const token = await obtenerFCMToken();
      if (token) {
        // Token se guarda en Firestore vía guardarFCMToken en useFCMPush
        // No guardar en localStorage para evitar inconsistencias
      }
    };

    // Solo registrar si ya tenemos permiso
    if (Notification.permission === "granted") {
      registrar();
    }
  }, []);

  return <>{children}</>;
}