/**
 * WhatsApp Provider — BarberApp
 *
 * Phase 1: ManyChat (envía vía ManyChat API → WhatsApp Business API)
 * Phase 2: n8n (webhook personalizado con lógica completa)
 *
 * Cambiar WHATSAPP_PROVIDER en .env para cambiar entre proveedores.
 */

const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || "manychat";

export interface MensajeWhatsApp {
  telefono: string;
  template: "confirmacion_cita" | "recordatorio_cita" | "cancelacion_cita" | "aviso_pago";
  data: Record<string, string>;
}

export async function enviarMensaje(mensaje: MensajeWhatsApp): Promise<{ success: boolean; error?: string }> {
  if (WHATSAPP_PROVIDER === "n8n") {
    return enviarViaN8n(mensaje);
  }
  return enviarViaManyChat(mensaje);
}

async function enviarViaManyChat(mensaje: MensajeWhatsApp): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MANYCHAT_API_KEY;
  if (!apiKey) {
    console.warn("[WhatsApp] MANYCHAT_API_KEY no configurado");
    return { success: false, error: "ManyChat API key not configured" };
  }

  const templates: Record<string, object> = {
    confirmacion_cita: {
      template: "confirmacion_cita",
      telefono: mensaje.telefono,
      params: {
        nombre_cliente: mensaje.data.nombre || "Cliente",
        fecha: mensaje.data.fecha || "",
        hora: mensaje.data.hora || "",
        servicio: mensaje.data.servicio || "",
        barbero: mensaje.data.barbero || "",
      },
    },
    recordatorio_cita: {
      template: "recordatorio_cita",
      telefono: mensaje.telefono,
      params: {
        nombre_cliente: mensaje.data.nombre || "Cliente",
        fecha: mensaje.data.fecha || "",
        hora: mensaje.data.hora || "",
        servicio: mensaje.data.servicio || "",
      },
    },
    cancelacion_cita: {
      template: "cancelacion_cita",
      telefono: mensaje.telefono,
      params: {
        nombre_cliente: mensaje.data.nombre || "Cliente",
        fecha: mensaje.data.fecha || "",
        hora: mensaje.data.hora || "",
        motivo: mensaje.data.motivo || "",
      },
    },
    aviso_pago: {
      template: "aviso_pago",
      telefono: mensaje.telefono,
      params: {
        nombre_barberia: mensaje.data.nombre_barberia || "",
        cantidad: mensaje.data.cantidad || "",
        vencida_desde: mensaje.data.vencida_desde || "",
      },
    },
  };

  const payload = templates[mensaje.template];
  if (!payload) {
    return { success: false, error: `Template ${mensaje.template} no encontrado` };
  }

  try {
    const response = await fetch("https://api.manychat.com/fb/sending/sendTemplateMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ManyChat] Send failed:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error("[ManyChat] Error enviando mensaje:", error);
    return { success: false, error: String(error) };
  }
}

async function enviarViaN8n(mensaje: MensajeWhatsApp): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("[WhatsApp] N8N_WEBHOOK_URL no configurado");
    return { success: false, error: "n8n webhook URL not configured" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mensaje),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[n8n] Send failed:", errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error("[n8n] Error enviando mensaje:", error);
    return { success: false, error: String(error) };
  }
}

// Helper específico para enviar confirmación de cita
export async function enviarConfirmacionCita(params: {
  telefono: string;
  nombre: string;
  fecha: string;
  hora: string;
  servicio: string;
  barbero: string;
}): Promise<{ success: boolean; error?: string }> {
  return enviarMensaje({
    telefono: params.telefono,
    template: "confirmacion_cita",
    data: params,
  });
}

// Helper para enviar recordatorio
export async function enviarRecordatorio(params: {
  telefono: string;
  nombre: string;
  fecha: string;
  hora: string;
  servicio: string;
}): Promise<{ success: boolean; error?: string }> {
  return enviarMensaje({
    telefono: params.telefono,
    template: "recordatorio_cita",
    data: params,
  });
}

// Helper para envío masivo (para campañas ManyChat)
export async function enviarCampañaMasiva(params: {
  telefonos: string[];
  template: string;
  data: Record<string, string>;
}): Promise<{ success: boolean; enviados: number; errores: number }> {
  let enviados = 0;
  let errores = 0;

  for (const telefono of params.telefonos) {
    const result = await enviarMensaje({
      telefono,
      template: params.template as MensajeWhatsApp["template"],
      data: params.data,
    });
    if (result.success) enviados++;
    else errores++;

    // Rate limit: 1 request per second
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return { success: errores === 0, enviados, errores };
}