import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { consumeOAuthCallback } from "~/server/auth";

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	const state = request.nextUrl.searchParams.get("state");

	if (!code) {
		redirect("/?auth=missing-code");
	}

	try {
		await consumeOAuthCallback({
			code,
			origin: request.nextUrl.origin,
			state,
		});
	} catch {
		redirect("/?auth=failed");
	}

	redirect("/?platform=1");
}
