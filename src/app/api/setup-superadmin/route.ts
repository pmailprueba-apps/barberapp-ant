import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  // Simple protection: requires a setup key from env
  const setupKey = request.headers.get("x-setup-key");
  if (!setupKey || setupKey !== process.env.MANYCHAT_API_KEY) { // Reusing manychat key as a temp secret
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await getAdminAuth().getUserByEmail(email);
    await getAdminAuth().setCustomUserClaims(user.uid, { role: "superadmin" });

    return NextResponse.json({ success: true, message: `User ${email} promoted to superadmin` });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
