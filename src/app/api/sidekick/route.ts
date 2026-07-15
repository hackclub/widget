import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import {
	getSidekickProject,
	getSidekickStats,
	listProjectTimeline,
	listSidekickProjects,
	listSidekickProjectsByAuthor,
	submitSidekickReviewAction,
	updateSidekickReviewAction,
} from "~/server/postgres-store";

const requestSchema = z.object({
	action: z.string(),
	input: z.record(z.unknown()).default({}),
});

function json(data: unknown, status = 200) {
	return NextResponse.json(data, {
		headers: {
			"cache-control": "no-store",
		},
		status,
	});
}

function error(status: number, code: string, message: string) {
	return json({ error: code, message }, status);
}

function hasValidSecret(request: NextRequest) {
	const header = request.headers.get("authorization");

	return header === `Bearer ${env.SIDEKICK_SECRET}`;
}

export async function POST(request: NextRequest) {
	if (!hasValidSecret(request)) {
		return error(401, "UNAUTHORIZED", "Invalid secret.");
	}

	const parsed = requestSchema.safeParse(
		await request.json().catch(() => null),
	);

	if (!parsed.success) {
		return error(400, "VALIDATION_ERROR", "Invalid Sidekick request body.");
	}

	const { action, input } = parsed.data;

	try {
		switch (action) {
			case "HEALTH_CHECK":
				return json({ ok: true, version: "1.0.0" });

			case "GET_PROGRAM_STATS":
				return json(await getSidekickStats());

			case "FETCH_PROJECTS":
				return json(
					await listSidekickProjects({
						cursor: typeof input.cursor === "string" ? input.cursor : null,
						limit: typeof input.limit === "number" ? input.limit : undefined,
						status: typeof input.status === "string" ? input.status : "all",
					}),
				);

			case "FETCH_PROJECT_DETAIL": {
				if (typeof input.projectId !== "string") {
					return error(400, "VALIDATION_ERROR", "projectId is required.");
				}

				const project = await getSidekickProject(input.projectId);

				return project
					? json(project)
					: error(404, "NOT_FOUND", "Project not found.");
			}

			case "FETCH_PROJECT_TIMELINE": {
				if (typeof input.projectId !== "string") {
					return error(400, "VALIDATION_ERROR", "projectId is required.");
				}

				const timeline = await listProjectTimeline(input.projectId);

				return timeline
					? json(timeline)
					: error(404, "NOT_FOUND", "Project not found.");
			}

			case "FETCH_AUTHOR_PROJECTS": {
				if (typeof input.authorId !== "string") {
					return error(400, "VALIDATION_ERROR", "authorId is required.");
				}

				return json(
					await listSidekickProjectsByAuthor({
						authorId: input.authorId,
						excludeProjectId:
							typeof input.excludeProjectId === "string"
								? input.excludeProjectId
								: undefined,
					}),
				);
			}

			case "SUBMIT_REVIEW_ACTION": {
				if (
					typeof input.shipId !== "string" ||
					typeof input.reviewerId !== "string" ||
					typeof input.action !== "string"
				) {
					return error(
						400,
						"VALIDATION_ERROR",
						"shipId, reviewerId, and action are required.",
					);
				}

				const event = await submitSidekickReviewAction({
					...input,
					action: input.action,
					reviewerId: input.reviewerId,
					shipId: input.shipId,
				});

				return event
					? json({ event, success: true })
					: error(404, "NOT_FOUND", "Ship not found.");
			}

			case "UPDATE_REVIEW_ACTION": {
				if (
					typeof input.shipId !== "string" ||
					typeof input.reviewerId !== "string" ||
					(input.type !== "approval" && input.type !== "rejection")
				) {
					return error(
						400,
						"VALIDATION_ERROR",
						"shipId, reviewerId, and type are required.",
					);
				}

				const success = await updateSidekickReviewAction({
					...input,
					reviewerId: input.reviewerId,
					shipId: input.shipId,
					type: input.type,
				});

				return success
					? json({ success: true })
					: error(404, "NOT_FOUND", "Review action not found.");
			}

			case "FETCH_SHOP_ITEMS":
				return json({ items: [] });

			case "FETCH_ORDERS":
				return json({ items: {}, orders: [], totalCount: 0 });

			case "FETCH_ORDER_DETAIL":
			case "REVEAL_ORDER_ADDRESS":
			case "UPDATE_ORDER_STATUS":
			case "UPDATE_ORDER_FIELDS":
			case "UPDATE_ITEM_FIELDS":
				return error(404, "NOT_FOUND", "Fulfillment is not configured.");

			case "FETCH_USER_NOTE":
			case "UPDATE_USER_NOTE":
				return error(400, "INVALID_ACTION", `Unsupported action: ${action}`);

			default:
				return error(400, "INVALID_ACTION", `Unknown action: ${action}`);
		}
	} catch (caught) {
		const message =
			caught instanceof Error ? caught.message : "Internal Sidekick error.";

		return error(500, "INTERNAL_ERROR", message);
	}
}
