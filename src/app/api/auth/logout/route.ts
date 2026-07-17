import { type NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, getPublicAppUrl } from "~/server/auth";

export async function POST(request: NextRequest) {
	await clearSessionCookie();

	const response = NextResponse.redirect(
		getPublicAppUrl("/?platform=1", request.nextUrl.origin),
		{ status: 303 },
	);
	response.headers.set("cache-control", "no-store");

	return response;
}
