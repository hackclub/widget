import { type NextRequest, NextResponse } from "next/server";

import {
	createOAuthSession,
	sessionCookieName,
	sessionCookieOptions,
	stateCookieName,
	stateCookieOptions,
} from "~/server/auth";

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");

	if (!code) {
		return NextResponse.redirect(new URL("/?auth=missing-code", request.url));
	}

	try {
		const session = await createOAuthSession({
			code,
			origin: request.nextUrl.origin,
			state,
		});

		const response = NextResponse.redirect(new URL("/?platform=1", request.url));
		response.cookies.set(
			sessionCookieName,
			session.sessionId,
			sessionCookieOptions(session.maxAge),
		);
		response.cookies.set(stateCookieName, "", stateCookieOptions());

		return response;
	} catch {
		const response = NextResponse.redirect(
			new URL("/?platform=1&auth=failed", request.url),
		);
		response.cookies.set(stateCookieName, "", stateCookieOptions());

		return response;
	}
}
