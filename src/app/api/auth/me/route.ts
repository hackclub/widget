import { type NextRequest, NextResponse } from "next/server";

import { getSessionFromHeaders } from "~/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
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
	} catch (error) {
		console.error("Direct auth.me route failed.", error);
		return NextResponse.json(
			{
				error: "session_lookup_failed",
			},
			{
				headers: {
					"cache-control": "no-store",
				},
				status: 500,
			},
		);
	}
}
