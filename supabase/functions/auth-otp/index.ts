import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, json } from "../_shared/cors.ts";
import { requireUser, type UserContext } from "../_shared/auth.ts";
import { sendEmail, sendWhatsApp } from "../_shared/messaging.ts";
import { randomOtp, sha256Hex } from "../_shared/otp.ts";

const PURPOSES = ["consent", "contact", "intercept", "visit"] as const;
type OtpPurpose = (typeof PURPOSES)[number];

// The phone is the CUSTOMER's number given at the outlet, proving the rep
// actually met the customer: E.164-ish, optional +, 9-15 digits.
const PHONE_RE = /^\+?[0-9]{9,15}$/;

const MAX_OPEN_CHALLENGES = 3;

// Secret material is sha256(profileId:purpose:code) — the plaintext code is
// never stored. The purpose is prepended in plaintext so both this function
// and auth-verify-otp can scope queries per purpose without a schema change.
async function challengeHash(
  profileId: string,
  purpose: OtpPurpose,
  code: string
): Promise<string> {
  return `${purpose}:${await sha256Hex(`${profileId}:${purpose}:${code}`)}`;
}

async function otpSettings(
  db: UserContext["db"]
): Promise<{ expiryMin: number; maxAttempts: number }> {
  const { data } = await db
    .from("app_settings")
    .select("key, value")
    .in("key", ["otp.expiry_min", "otp.max_attempts"]);
  const map = new Map((data ?? []).map((s) => [s.key, s.value]));
  const expiry = Number(map.get("otp.expiry_min") ?? 10);
  const attempts = Number(map.get("otp.max_attempts") ?? 5);
  return {
    expiryMin: Number.isFinite(expiry) && expiry > 0 ? expiry : 10,
    maxAttempts: Number.isFinite(attempts) && attempts > 0 ? attempts : 5,
  };
}

// WhatsApp + email delivery config from app_settings (managed via the web
// Settings page); falls back to function secrets inside messaging.ts.
async function deliverySettings(
  db: UserContext["db"]
): Promise<{
  whatsapp: { accessToken?: string; phoneNumberId?: string };
  resendApiKey?: string;
}> {
  const { data } = await db
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "whatsapp.access_token",
      "whatsapp.phone_number_id",
      "resend.api_key",
    ]);
  const map = new Map((data ?? []).map((s) => [s.key, s.value]));
  const str = (k: string) => {
    const v = map.get(k);
    return typeof v === "string" && v ? v : undefined;
  };
  return {
    whatsapp: {
      accessToken: str("whatsapp.access_token"),
      phoneNumberId: str("whatsapp.phone_number_id"),
    },
    resendApiKey: str("resend.api_key"),
  };
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // The gateway enforces verify_jwt = true, but we double-check the token so
  // the function is safe even if it is ever exposed without JWT verification.
  const { ctx, error } = await requireUser(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { purpose, phone } = body as {
    purpose?: string;
    phone?: string;
  };
  if (!PURPOSES.includes(purpose as OtpPurpose)) {
    return json({ error: "Invalid purpose" }, 400);
  }
  if (typeof phone !== "string" || !PHONE_RE.test(phone)) {
    return json({ error: "Invalid phone number" }, 400);
  }

  const { expiryMin, maxAttempts } = await otpSettings(ctx.db);

  // Burn stale challenges, then cap concurrent open ones per profile+purpose.
  await ctx.db
    .from("auth_otp_challenges")
    .delete()
    .eq("profile_id", ctx.profile.id)
    .lt("expires_at", new Date().toISOString());

  const { data: open } = await ctx.db
    .from("auth_otp_challenges")
    .select("id")
    .eq("profile_id", ctx.profile.id)
    .like("code_hash", `${purpose}:%`)
    .is("consumed_at", null)
    .order("created_at", { ascending: true });
  if ((open ?? []).length > MAX_OPEN_CHALLENGES) {
    const excess = open!
      .slice(0, open!.length - MAX_OPEN_CHALLENGES)
      .map((c) => c.id);
    await ctx.db.from("auth_otp_challenges").delete().in("id", excess);
  }

  const code = randomOtp();
  const expiresAt = new Date(Date.now() + expiryMin * 60_000);

  const { data: challenge, error: insertError } = await ctx.db
    .from("auth_otp_challenges")
    .insert({
      profile_id: ctx.profile.id,
      code_hash: await challengeHash(ctx.profile.id, purpose as OtpPurpose, code),
      expires_at: expiresAt.toISOString(),
      attempts: 0,
    })
    .select("id")
    .single();
  if (insertError) {
    return json({ error: insertError.message }, 500);
  }

  const message = `NiceOS verification: your code is ${code}. Valid ${expiryMin} min. Do not share.`;
  const delivery = await deliverySettings(ctx.db);
  let channel: "whatsapp" | "email" = "whatsapp";
  const sent = await sendWhatsApp(phone, message, delivery.whatsapp);
  if (!sent) {
    const { data: profile } = await ctx.db
      .from("profiles")
      .select("email")
      .eq("id", ctx.profile.id)
      .maybeSingle();
    const emailSent = profile?.email
      ? await sendEmail(profile.email, "NiceOS verification code", message, delivery.resendApiKey)
      : false;
    if (!emailSent) {
      // Never leave a challenge that no channel can deliver.
      await ctx.db.from("auth_otp_challenges").delete().eq("id", challenge!.id);
      return json(
        { ok: false, error: "No messaging channel configured" },
        502
      );
    }
    channel = "email";
  }

  // The code is never returned — only the channel + expiry are revealed.
  return json({
    ok: true,
    channel,
    expires_at: expiresAt.toISOString(),
    purpose,
    challenge_created: true,
  });
});