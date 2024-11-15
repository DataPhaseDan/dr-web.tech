import { Handlers, STATUS_CODE } from "$fresh/server.ts";
import "jsr:@std/dotenv/load";

async function getAccessToken() {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing env vars:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken
    });
    throw new Error("OAuth credentials not found in environment variables");
  }

  try {
    const tokenParams = {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    };

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OAuth token error response:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`OAuth token error: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error("No access token in response:", data);
      throw new Error("No access token received");
    }
    return data.access_token;
  } catch (error) {
    console.error("Token fetch error:", error);
    throw error;
  }
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
  async POST(req: Request) {
    try {
      // Check content type
      const contentType = req.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
          status: STATUS_CODE.BadRequest,
          headers: { "Content-Type": "application/json" }
        });
      }

      let payload;
      try {
        payload = await req.json();
      } catch (e) {
        console.error("JSON parse error:", e);
        return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
          status: STATUS_CODE.BadRequest,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (!payload || typeof payload !== 'object') {
        return new Response(JSON.stringify({ error: "Invalid payload format" }), {
          status: STATUS_CODE.BadRequest,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { mail, message } = payload;
      if (!mail || !message) {
        return new Response(JSON.stringify({ error: "Missing required fields: mail and message" }), {
          status: STATUS_CODE.BadRequest,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (typeof mail !== 'string' || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: "Invalid field types: mail and message must be strings" }), {
          status: STATUS_CODE.BadRequest,
          headers: { "Content-Type": "application/json" }
        });
      }

      const gmail_user = Deno.env.get("GMAIL_USER");
      if (!gmail_user) {
        console.error("GMAIL_USER environment variable not found");
        throw new Error("Gmail user not found in environment variables");
      }

      const accessToken = await getAccessToken();

      const subject = `New message from ${mail}`;
      const raw = createEmailContent(gmail_user, gmail_user, subject, message);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gmail API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Gmail API error: ${errorText || response.statusText}`);
      }

      return new Response(JSON.stringify({ status: "success" }), {
        status: STATUS_CODE.OK,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      console.error("Error in mail handler:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: STATUS_CODE.BadRequest,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};
