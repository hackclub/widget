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
const defaultHackClubScopes =
	"email profile verification_status birthdate slack_id address";

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

const unknownRecordSchema = z.record(z.string(), z.unknown());

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

export type SubmissionIdentity = {
	addressLine1: string | null;
	addressLine2: string | null;
	birthday: string | null;
	city: string | null;
	country: string | null;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	postalCode: string | null;
	slackId: string | null;
	stateOrProvince: string | null;
};

function secureCookies() {
	return env.NODE_ENV === "production";
}

function cleanEnvValue(value: string) {
	const trimmed = value.trim();
	const withoutMatchingQuotes =
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
			? trimmed.slice(1, -1)
			: trimmed;

	return withoutMatchingQuotes.trim();
}

function getHackClubClientId() {
	return cleanEnvValue(env.HACK_CLUB_CLIENT_ID);
}

function getHackClubClientSecret() {
	return cleanEnvValue(env.HACK_CLUB_CLIENT_SECRET);
}

function getHackClubScopes() {
	return cleanEnvValue(env.HACK_CLUB_SCOPES ?? defaultHackClubScopes);
}

export function getRedirectUri(origin: string) {
	const configuredRedirectUri =
		env.HACKCLUB_REDIRECT_URI ?? env.HACK_CLUB_REDIRECT_URI;
	const redirectUri = configuredRedirectUri
		? cleanEnvValue(configuredRedirectUri)
		: `${origin}/api/auth/callback`;

	if (redirectUri.startsWith("http://") || redirectUri.startsWith("https://")) {
		return redirectUri;
	}

	return `https://${redirectUri}`;
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
	authorizeUrl.searchParams.set("client_id", getHackClubClientId());
	authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(origin));
	authorizeUrl.searchParams.set("response_type", "code");
	authorizeUrl.searchParams.set("scope", getHackClubScopes());
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
			client_id: getHackClubClientId(),
			client_secret: getHackClubClientSecret(),
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

	const profileRoot = profileSchema.parse(await profileResponse.json());
	const user = buildAuthUser(profileRoot, crypto.randomUUID());
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

	return refreshStaleSessionUser(decodedSessionId, session);
}

async function refreshStaleSessionUser(sessionId: string, session: Session) {
	if (session.user.name !== "Hack Clubber") {
		return session;
	}

	const profileResponse = await fetch(`${authBaseUrl}/api/v1/me`, {
		headers: {
			authorization: `Bearer ${session.accessToken}`,
		},
	});

	if (!profileResponse.ok) {
		return session;
	}

	const profileRoot = unknownRecordSchema.parse(await profileResponse.json());
	const authUser = buildAuthUser(profileRoot, session.user.id);
	const refreshedSession: Session = {
		...session,
		user: {
			...session.user,
			email: authUser.email ?? session.user.email,
			name: authUser.name,
			slackId: authUser.slackId ?? session.user.slackId,
		},
	};

	await saveSession(sessionId, refreshedSession);

	return refreshedSession;
}

export async function getSubmissionIdentity(session: Session) {
	const profileResponse = await fetch(`${authBaseUrl}/api/v1/me`, {
		headers: {
			authorization: `Bearer ${session.accessToken}`,
		},
	});

	if (!profileResponse.ok) {
		throw new Error("Hack Club profile lookup failed.");
	}

	const profileRoot = unknownRecordSchema.parse(await profileResponse.json());
	const profile = readIdentityRecord(profileRoot);
	const address = readAddress(profile);
	const authName = readString(profile, "name");
	const firstName =
		readString(profile, "first_name") ??
		readString(
			profile,
			"firstName",
			"given_name",
			"givenName",
			"legal_first_name",
		) ??
		readString(address, "first_name", "firstName") ??
		splitName(authName ?? session.user.name).firstName;
	const lastName =
		readString(profile, "last_name") ??
		readString(
			profile,
			"lastName",
			"family_name",
			"familyName",
			"legal_last_name",
		) ??
		readString(address, "last_name", "lastName") ??
		splitName(authName ?? session.user.name).lastName;

	return {
		addressLine1: readString(
			address,
			"line1",
			"line_1",
			"address_line_1",
			"addressLine1",
			"street1",
			"street_1",
		),
		addressLine2: readString(
			address,
			"line2",
			"line_2",
			"address_line_2",
			"addressLine2",
			"street2",
			"street_2",
		),
		birthday: readString(profile, "birthday", "birthdate", "date_of_birth"),
		city: readString(address, "city"),
		country: readString(address, "country", "country_code", "countryCode"),
		email: readString(profile, "email", "primary_email") ?? session.user.email,
		firstName,
		lastName,
		postalCode: readString(
			address,
			"zip",
			"zip_code",
			"postal_code",
			"postalCode",
		),
		slackId: readString(profile, "slack_id", "slackId") ?? session.user.slackId,
		stateOrProvince: readString(
			address,
			"state",
			"province",
			"state_province",
			"stateOrProvince",
		),
	} satisfies SubmissionIdentity;
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

function splitName(name: string | null) {
	const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];

	if (parts.length === 0) {
		return {
			firstName: null,
			lastName: null,
		};
	}

	return {
		firstName: parts[0] ?? null,
		lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
	};
}

function buildAuthUser(
	profileRoot: Record<string, unknown>,
	fallbackId: string,
): AuthUser {
	const profile = readIdentityRecord(profileRoot);
	const email = readString(profile, "email", "primary_email");
	const slackId = readString(profile, "slack_id", "slackId");
	const id = readString(profile, "id") ?? email ?? slackId ?? fallbackId;

	return {
		email,
		id,
		name:
			fullName(profile) ??
			readString(profile, "name") ??
			readString(profile, "preferred_username", "preferredUsername") ??
			email ??
			id,
		slackId,
	};
}

function fullName(profile: Record<string, unknown>) {
	const firstName = readString(
		profile,
		"first_name",
		"firstName",
		"given_name",
		"givenName",
	);
	const lastName = readString(
		profile,
		"last_name",
		"lastName",
		"family_name",
		"familyName",
	);

	return [firstName, lastName].filter(Boolean).join(" ") || null;
}

function readIdentityRecord(profile: Record<string, unknown>) {
	return readRecord(profile, "identity") ?? profile;
}

function readAddress(profile: Record<string, unknown>) {
	const directAddress = readRecord(
		profile,
		"address",
		"shipping_address",
		"shippingAddress",
		"primary_address",
		"primaryAddress",
	);

	if (directAddress) {
		return directAddress;
	}

	const addresses = readArray(profile, "addresses", "shipping_addresses");
	const firstAddress = addresses
		.map((entry) => (isRecord(entry) ? entry : null))
		.find(Boolean);

	return firstAddress ?? {};
}

function readArray(record: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = record[key];

		if (Array.isArray(value)) {
			return value;
		}
	}

	return [];
}

function readRecord(record: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = record[key];

		if (isRecord(value)) {
			return value;
		}
	}

	return null;
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
	for (const key of keys) {
		const value = record[key];

		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
