import { Handlers, STATUS_CODE } from "$fresh/server.ts";

// Gmail API endpoint
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export const handler: Handlers = {
  async POST(request: Request) {
    const payload: { mail: string; message: string } | undefined = await request.json();
    
    if (!payload) {
      return new Response("", { status: STATUS_CODE.NoContent });
    }

    try {
      // Get the credentials from environment variables
      const credentials = Deno.env.get("GOOGLE_CREDENTIALS");
      if (!credentials) {
        throw new Error("Google credentials not found");
      }

      // Parse the credentials
      const parsedCredentials = JSON.parse(credentials);
      
      // Get access token using JWT
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: await createJWT(parsedCredentials),
        }),
      });

      const { access_token } = await tokenResponse.json();

      // Construct email in RFC 2822 format
      const emailContent = [
        "From: " + Deno.env.get("EMAIL_FROM"),
        "To: " + Deno.env.get("EMAIL_TO"),
        "Subject: New message from " + payload.mail,
        "",
        payload.message,
      ].join("\r\n");

      // Encode the email in base64URL format
      const encodedEmail = btoa(emailContent).replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email using Gmail API
      const response = await fetch(GMAIL_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
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

interface GoogleCredentials {
  client_email: string;
  private_key: string;
}

async function createJWT(credentials: GoogleCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 60 * 60;
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/gmail.send",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + oneHour,
    iat: now,
  };

  // Encode header and claim
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedClaim = btoa(JSON.stringify(claim));
  
  // Create signature input
  const signatureInput = `${encodedHeader}.${encodedClaim}`;
  
  // Sign using RS256
  const key = await crypto.subtle.importKey(
    "pkcs8",
    new TextEncoder().encode(credentials.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );
  
  // Encode signature
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  // Return complete JWT
  return `${signatureInput}.${encodedSignature}`;
}
