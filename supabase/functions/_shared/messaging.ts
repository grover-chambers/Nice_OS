const WHATSAPP_API_VERSION = "v19.0";

// Send a WhatsApp text via the WhatsApp Cloud API. Returns false when no
// credentials are configured or the API rejects the send.
export async function sendWhatsApp(
  to: string,
  body: string
): Promise<boolean> {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) return false;

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
  text: string
): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
