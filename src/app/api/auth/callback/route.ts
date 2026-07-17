import { type NextRequest, NextResponse } from "next/server";

import {
	clearStateCookieOptions,
	createOAuthSession,
	getPublicAppUrl,
	sessionCookieName,
	sessionCookieOptions,
	stateCookieName,
} from "~/server/auth";

function redirectWithClearedState(request: NextRequest, path: string) {
	const response = NextResponse.redirect(
		getPublicAppUrl(path, request.nextUrl.origin),
	);
	response.cookies.set(stateCookieName, "", clearStateCookieOptions());

	return response;
}

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");

	if (!code) {
		return redirectWithClearedState(request, "/?auth=missing-code");
	}

	try {
		const session = await createOAuthSession({
			code,
			origin: request.nextUrl.origin,
			state,
		});

		const response = redirectWithClearedState(request, "/?platform=1");
		response.cookies.set(
			sessionCookieName,
			session.sessionId,
			sessionCookieOptions(session.maxAge),
		);

		return response;
	} catch {
		return redirectWithClearedState(request, "/?platform=1&auth=failed");
	}
}
