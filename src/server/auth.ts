import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { env } from "~/env";
import {
	deleteSession,
	getSession,
	saveSession,
} from "~/server/postgres-store";

const authBaseUrl = "https://auth.hackclub.com";
export const sessionCookieName = "widget_session";
const stateCookieName = "widget_oauth_state";
const sessionMaxAge = 60 * 60 * 24 * 30;
const stateMaxAge = 60 * 10;

const tokenResponseSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	refresh_token: z.string().optional(),
	scope: z.string().optional(),
	token_type: z.string(),
});

const profileSchema = z
	.object({
		id: z.string().optional(),
		email: z.string().email().optional(),
		name: z.string().optional(),
		preferred_username: z.string().optional(),
		slack_id: z.string().optional(),
	})
	.passthrough();

export type AuthUser = {
	id: string;
	email: string | null;
	name: string;
	slackId: string | null;
};

export type Session = {
	accessToken: string;
	createdAt: string;
	expiresAt: string;
	refreshToken: string | null;
	user: AuthUser;
};

function secureCookies() {
	return env.NODE_ENV === "production";
}

export function getRedirectUri(origin: string) {
	return env.HACK_CLUB_REDIRECT_URI ?? `${origin}/api/auth/callback`;
}

export async function createAuthRedirect(origin: string) {
	const state = crypto.randomUUID();
	const cookieStore = await cookies();
	cookieStore.set(stateCookieName, state, {
		httpOnly: true,
		maxAge: stateMaxAge,
		path: "/",
		sameSite: "lax",
		secure: secureCookies(),
	});

	const authorizeUrl = new URL("/oauth/authorize", authBaseUrl);
	authorizeUrl.searchParams.set("client_id", env.HACK_CLUB_CLIENT_ID);
	authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(origin));
	authorizeUrl.searchParams.set("response_type", "code");
	authorizeUrl.searchParams.set("scope", env.HACK_CLUB_SCOPES ?? "email");
	authorizeUrl.searchParams.set("state", state);

	return authorizeUrl;
}

export async function consumeOAuthCallback(input: {
	code: string;
	origin: string;
	state: string | null;
}) {
	const cookieStore = await cookies();
	const expectedState = cookieStore.get(stateCookieName)?.value;
	cookieStore.delete(stateCookieName);

	if (!expectedState || expectedState !== input.state) {
		throw new Error("Invalid OAuth state.");
	}

	const tokenResponse = await fetch(`${authBaseUrl}/oauth/token`, {
		body: JSON.stringify({
			client_id: env.HACK_CLUB_CLIENT_ID,
			client_secret: env.HACK_CLUB_CLIENT_SECRET,
			code: input.code,
			grant_type: "authorization_code",
			redirect_uri: getRedirectUri(input.origin),
		}),
		headers: {
			"content-type": "application/json",
		},
		method: "POST",
	});

	if (!tokenResponse.ok) {
		throw new Error("Hack Club token exchange failed.");
	}

	const token = tokenResponseSchema.parse(await tokenResponse.json());
	const profileResponse = await fetch(`${authBaseUrl}/api/v1/me`, {
		headers: {
			authorization: `Bearer ${token.access_token}`,
		},
	});

	if (!profileResponse.ok) {
		throw new Error("Hack Club profile lookup failed.");
	}

	const profile = profileSchema.parse(await profileResponse.json());
	const fallbackId = profile.email ?? profile.slack_id ?? crypto.randomUUID();
	const user: AuthUser = {
		email: profile.email ?? null,
		id: profile.id ?? fallbackId,
		name:
			profile.name ??
			profile.preferred_username ??
			profile.email ??
			"Hack Clubber",
		slackId: profile.slack_id ?? null,
	};
	const sessionId = crypto.randomUUID();
	const now = Date.now();
	const expiresAt = new Date(now + token.expires_in * 1000).toISOString();

	const session: Session = {
		accessToken: token.access_token,
		createdAt: new Date(now).toISOString(),
		expiresAt,
		refreshToken: token.refresh_token ?? null,
		user,
	};

	await saveSession(sessionId, session);

	cookieStore.set(sessionCookieName, sessionId, {
		httpOnly: true,
		maxAge: Math.min(sessionMaxAge, token.expires_in),
		path: "/",
		sameSite: "lax",
		secure: secureCookies(),
	});
}

export async function getSessionFromHeaders(headers: Headers) {
	const cookie = headers.get("cookie");
	const sessionId = cookie
		?.split(";")
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith(`${sessionCookieName}=`))
		?.slice(sessionCookieName.length + 1);

	if (!sessionId) {
		return null;
	}

	const decodedSessionId = decodeURIComponent(sessionId);
	const session = await getSession(decodedSessionId);

	if (!session) {
		return null;
	}

	if (Date.parse(session.expiresAt) <= Date.now()) {
		await deleteSession(decodedSessionId);
		return null;
	}

	return session;
}

export async function clearSessionCookie() {
	const cookieStore = await cookies();
	const sessionId = cookieStore.get(sessionCookieName)?.value;

	if (sessionId) {
		await deleteSession(sessionId);
	}

	cookieStore.set(sessionCookieName, "", {
		expires: new Date(0),
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: secureCookies(),
	});
}
