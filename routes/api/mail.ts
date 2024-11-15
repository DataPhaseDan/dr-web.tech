import { Handlers, STATUS_CODE } from "$fresh/server.ts";
import "jsr:@std/dotenv/load";

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

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY environment variable not found");
        throw new Error("Resend API key not found in environment variables");
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "mail@dr-web.tech",
          to: "daniel.renner@webtechnologies.info",
          subject: `New message from ${mail}`,
          html: `From: ${mail} ${message}<`,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Resend API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Resend API error: ${errorText || response.statusText}`);
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
}
