import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createAuthRedirect } from "~/server/auth";

export async function GET(request: NextRequest) {
	const origin = request.nextUrl.origin;
	const authUrl = await createAuthRedirect(origin);

	redirect(authUrl.toString());
}
