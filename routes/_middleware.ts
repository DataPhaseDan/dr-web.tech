import type { FreshContext } from "$fresh/server.ts";

import de from "../utils/i18n/de.json" with { type: "json" };
import en from "../utils/i18n/en.json" with { type: "json" };

import SecurityHeaders from "../utils/securityHeaders.ts";
import type { State } from "../utils/types.ts";

export const handler = [
	async function setLanguage(req: Request, ctx: FreshContext<State>) {
		const cookie = req.headers.get("cookie");
		if (cookie?.includes("lang")) {
			ctx.state.lang = cookie.split("=")[1] as "en" | "de";
			ctx.state.translation = ctx.state.lang === "en" ? en : de;
			return await ctx.next();
		}
		ctx.state.lang = req.headers.get("accept-language")?.includes("de")
			? "de"
			: "en";
		ctx.state.translation = ctx.state.lang === "en" ? en : de;
		const res = await ctx.next();
		res.headers.set("Set-Cookie", `lang=${ctx.state.lang}`);
		return res;
	},
	async function setSecurityHeaders(req: Request, ctx: FreshContext<State>) {
		const resp = await ctx.next();
		
		// Skip certain security headers for API routes
		if (!req.url.includes('/api/')) {
			SecurityHeaders.map((header) => {
				resp.headers.set(header.key, header.value);
			});
		} else {
			// Set only essential security headers for API routes
			resp.headers.set("X-Content-Type-Options", "nosniff");
			resp.headers.set("Referrer-Policy", "origin-when-cross-origin");
			resp.headers.set("X-Frame-Options", "DENY");
		}
		
		return resp;
	},
];
