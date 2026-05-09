import { NextRequest, NextResponse } from "next/server";
import { getBarberiaPorSlug } from "@/lib/barberias";
import { crearCita } from "@/lib/citas";

/**
 * ManyChat Webhook Handler — BarberApp Phase 1
 *
 * ManyChat sends POST requests with JSON body:
 * {
 *   "event": "lead_property_updated",
 *   "triggered_at": "2026-05-03T12:00:00Z",
 *   "data": {
 *     "subscriber_id": "12345",
 *     "field_name": "custom_field_barberia_slug",
 *     "new_value": "el-estilo"
 *   }
 * }
 *
 * For incoming messages, ManyChat sends:
 * {
 *   "event": "message_received",
 *   "data": {
 *     "subscriber_id": "12345",
 *     "message_content": "Quiero reservar"
 *   }
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    console.log("[ManyChat Webhook] Event:", event, "Data:", JSON.stringify(data));

    switch (event) {
      case "message_received": {
        const { subscriber_id, message_content } = data;
        await handleIncomingMessage(subscriber_id, message_content);
        break;
      }
      case "lead_property_updated": {
        const { field_name, new_value } = data;
        // ManyChat triggers this when a custom field is updated
        // Used for: barberia_slug, fecha_reserva, hora_reserva, servicioId
        console.log(`[ManyChat] Field ${field_name} updated to: ${new_value}`);
        break;
      }
      case "subscriber_tag_updated": {
        // Handle tag updates for flow control
        console.log("[ManyChat] Tag updated:", data);
        break;
      }
      default:
        console.log("[ManyChat] Unhandled event:", event);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[ManyChat Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handleIncomingMessage(subscriberId: string, message: string) {
  // Normalize message
  const text = (message || "").trim().toLowerCase();

  // Routing for common intents
  if (text.includes("reserv") || text.includes("cita") || text.includes("agendar")) {
    // ManyChat flow: asks for fecha, hora, barbero, servicio
    // Acknowledge and start flow
    console.log(`[ManyChat] Reservation intent from ${subscriberId}: ${message}`);
  } else if (text.includes("cancel")) {
    console.log(`[ManyChat] Cancel intent from ${subscriberId}: ${message}`);
  } else if (text.includes("horario") || text.includes("disponib")) {
    console.log(`[ManyChat] Availability query from ${subscriberId}: ${message}`);
  } else if (text.includes("punto")) {
    console.log(`[ManyChat] Points query from ${subscriberId}: ${message}`);
  } else {
    console.log(`[ManyChat] Generic message from ${subscriberId}: ${message}`);
  }
}

// GET — ManyChat verifies the webhook endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  // ManyChat verification: return the challenge if verify_token matches
  const expectedToken = process.env.MANYCHAT_VERIFY_TOKEN || "barberapp_verify_token";

  if (verifyToken === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}