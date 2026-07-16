import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AIRTABLE_BASE_ID: z.string().min(1).optional(),
		AIRTABLE_TABLE_ID: z.string().min(1).optional(),
		AIRTABLE_TOKEN: z.string().min(1).optional(),
		HACK_CLUB_CLIENT_ID: z.string().min(1),
		HACK_CLUB_CLIENT_SECRET: z.string().min(1),
		HACK_CLUB_REDIRECT_URI: z.string().min(1).optional(),
		HACK_CLUB_SCOPES: z.string().min(1).optional(),
		NODE_ENV: z.enum(["development", "test", "production"]),
		POSTGRES_URL: z.string().url(),
		SIDEKICK_SECRET: z.string().min(1),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
		AIRTABLE_TABLE_ID: process.env.AIRTABLE_TABLE_ID,
		AIRTABLE_TOKEN: process.env.AIRTABLE_TOKEN,
		HACK_CLUB_CLIENT_ID: process.env.HACK_CLUB_CLIENT_ID,
		HACK_CLUB_CLIENT_SECRET: process.env.HACK_CLUB_CLIENT_SECRET,
		HACK_CLUB_REDIRECT_URI: process.env.HACK_CLUB_REDIRECT_URI,
		HACK_CLUB_SCOPES: process.env.HACK_CLUB_SCOPES,
		NODE_ENV: process.env.NODE_ENV,
		POSTGRES_URL: process.env.POSTGRES_URL,
		SIDEKICK_SECRET: process.env.SIDEKICK_SECRET,
		// NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
