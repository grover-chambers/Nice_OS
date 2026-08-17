const WHATSAPP_API_VERSION = "v19.0";

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
}

// Resolves WhatsApp credentials: explicit params (from app_settings) win;
// falls back to function secrets (Deno env) for backward compatibility.
function whatsappCredentials(
  opts?: Partial<WhatsAppCredentials>
): WhatsAppCredentials | null {
  const accessToken = opts?.accessToken ?? Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId =
    opts?.phoneNumberId ?? Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

// Send a WhatsApp text via the WhatsApp Cloud API. Returns false when no
// credentials are configured or the API rejects the send.
export async function sendWhatsApp(
  to: string,
  body: string,
  opts?: Partial<WhatsAppCredentials>
): Promise<boolean> {
  const creds = whatsappCredentials(opts);
  if (!creds) return false;

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${creds.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
  return res.ok;
}

// Send a plain-text email via Resend. Returns false when no API key is set.
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  apiKey?: string
): Promise<boolean> {
  const key = apiKey ?? Deno.env.get("RESEND_API_KEY");
  if (!key) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") ?? "NiceOS <otp@niceos.app>",
      to,
      subject,
      text,
    }),
  });
  return res.ok;
}