import { type NextRequest, NextResponse } from "next/server";

import { getSessionFromHeaders } from "~/server/auth";

export async function GET(request: NextRequest) {
	const session = await getSessionFromHeaders(request.headers);

	if (!session) {
		console.log("Direct auth.me route returned signed out.");
		return NextResponse.json(null, {
			headers: {
				"cache-control": "no-store",
			},
		});
	}

	console.log("Direct auth.me route returned signed in.", {
		userId: session.user.id,
	});

	return NextResponse.json(
		{
			expiresAt: session.expiresAt,
			user: session.user,
		},
		{
			headers: {
				"cache-control": "no-store",
			},
		},
	);
}
