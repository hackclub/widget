import { type NextRequest, NextResponse } from "next/server";

import {
	createAuthUrl,
	oauthStateCookieOptions,
	stateCookieName,
} from "~/server/auth";

export async function GET(request: NextRequest) {
	const origin = request.nextUrl.origin;
	const state = crypto.randomUUID();
	const authUrl = createAuthUrl(origin, state);
	const response = NextResponse.redirect(authUrl);
	response.cookies.set(stateCookieName, state, oauthStateCookieOptions());

	return response;
}
