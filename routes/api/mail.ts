import { Handlers, STATUS_CODE } from "$fresh/server.ts";
import "jsr:@std/dotenv/load";

async function getAccessToken() {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("OAuth credentials not found in environment variables");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return data.access_token;
}

function createEmailContent(from: string, to: string, subject: string, message: string): string {
  const emailContent = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    `<html><body>`,
    `<p>From: ${from}</p>`,
    `<p>${message}</p>`,
    `</body></html>`
  ].join('\r\n');

  return btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const handler: Handlers = {
  async POST(request: Request) {
    const payload: { mail: string; message: string } | undefined = await request.json();
    
    if (!payload) {
      return new Response("", { status: STATUS_CODE.NoContent });
    }

    try {
      const gmail_user = Deno.env.get("GMAIL_USER");
      if (!gmail_user) {
        throw new Error("Gmail user not found in environment variables");
      }

      // Get fresh access token
      const accessToken = await getAccessToken();

      // Create email content
      const subject = `New message from ${payload.mail}`;
      const raw = createEmailContent(gmail_user, gmail_user, subject, payload.message);

      // Send email using Gmail API
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: raw
        })
      });

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.statusText}`);
      }

      return new Response("", { status: STATUS_CODE.OK });
    } catch (error) {
      console.error("Error sending email:", error);
      return new Response("", { status: STATUS_CODE.BadRequest });
    }
  },
};
