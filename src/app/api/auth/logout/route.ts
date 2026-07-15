import { type NextRequest, NextResponse } from "next/server";

import { clearSessionCookie } from "~/server/auth";

export async function POST(request: NextRequest) {
	await clearSessionCookie();

	const response = NextResponse.redirect(new URL("/?platform=1", request.url), {
		status: 303,
	});
	response.headers.set("cache-control", "no-store");

	return response;
}
