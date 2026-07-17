import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createAirtableProjectSubmission } from "~/server/airtable";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getSubmissionIdentity } from "~/server/auth";
import {
	createProject,
	deleteDraftProject,
	getDraftProjectForOwner,
	listProjectsForOwner,
	type Project,
	submitProjectForReview,
	updateProject,
} from "~/server/postgres-store";

const keepExistingScreenshotValue = "__widget_keep_existing_screenshot__";

function normalizeUrl(value: string, ctx: z.RefinementCtx) {
	const trimmedValue = value.trim();
	const urlValue = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedValue)
		? trimmedValue
		: `https://${trimmedValue}`;

	try {
		const url = new URL(urlValue);

		if (url.protocol !== "http:" && url.protocol !== "https:") {
			ctx.addIssue({
				code: "custom",
				message: "Use an http or https URL.",
			});
			return z.NEVER;
		}

		return url.toString();
	} catch {
		ctx.addIssue({
			code: "custom",
			message: "Enter a valid URL.",
		});
		return z.NEVER;
	}
}

const urlSchema = z.string().trim().min(1).max(500).transform(normalizeUrl);
const hackatimeUrlSchema = urlSchema.refine(
	(value) => {
		const hostname = new URL(value).hostname.toLowerCase();
		return hostname === "hackatime.hackclub.com";
	},
	{
		message: "Enter a hackatime.hackclub.com URL.",
	},
);
const screenshotSchema = z
	.string()
	.trim()
	.max(1_500_000, "Screenshot uploads must be smaller than 1 MB.")
	.transform((value, ctx) => {
		if (value === "") {
			return null;
		}

		if (/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value)) {
			return value;
		}

		return normalizeUrl(value, ctx);
	});

const projectInput = z.object({
	codebaseUrl: urlSchema,
	description: z.string().min(20).max(700),
	name: z.string().min(2).max(80),
	playableUrl: urlSchema,
	screenshotUrl: screenshotSchema,
	status: z.enum(["draft", "submitted"]),
});
const projectUpdateInput = projectInput.extend({
	projectId: z.string().uuid(),
	screenshotUrl: z.union([
		z.literal(keepExistingScreenshotValue),
		screenshotSchema,
	]),
});

const finalSubmissionInput = z.object({
	estimatedHoursSpent: z.coerce.number().min(0.25).max(500),
	githubUsername: z.string().trim().min(1).max(80),
	hackatimeProjectUrl: hackatimeUrlSchema,
	projectId: z.string().uuid(),
});

function isUploadedScreenshot(value: string | null) {
	return value?.startsWith("data:image/") ?? false;
}

function projectForClient(project: Project | null) {
	if (!project) {
		return null;
	}

	return {
		...project,
		hasUploadedScreenshot: isUploadedScreenshot(project.screenshotUrl),
		screenshotUrl: isUploadedScreenshot(project.screenshotUrl)
			? null
			: project.screenshotUrl,
	};
}

export const projectsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(projectInput)
		.mutation(async ({ ctx, input }) => {
			const now = new Date().toISOString();
			const project: Project = {
				...input,
				hackClubInfo: "",
				id: crypto.randomUUID(),
				ownerId: ctx.session.user.id,
				createdAt: now,
				status: input.status === "submitted" ? "pending" : "draft",
				updatedAt: now,
			};

			return projectForClient(await createProject(project));
		}),

	listMine: protectedProcedure.query(({ ctx }) => {
		return listProjectsForOwner(ctx.session.user.id);
	}),

	removeDraft: protectedProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const didDelete = await deleteDraftProject(
				ctx.session.user.id,
				input.projectId,
			);

			if (!didDelete) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Draft project not found.",
				});
			}

			return { projectId: input.projectId };
		}),

	submitForReview: protectedProcedure
		.input(finalSubmissionInput)
		.mutation(async ({ ctx, input }) => {
			const project = await getDraftProjectForOwner(
				ctx.session.user.id,
				input.projectId,
			);

			if (!project) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Draft project not found.",
				});
			}

			try {
				const identity = await getSubmissionIdentity(ctx.session);
				const slackId = identity.slackId ?? ctx.session.user.slackId;

				if (!slackId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message:
							"Hack Club Auth did not return a Slack ID. Please sign out and sign in again.",
					});
				}

				await createAirtableProjectSubmission({
					identity,
					project,
					submission: {
						estimatedHoursSpent: input.estimatedHoursSpent,
						githubUsername: input.githubUsername,
						hackatimeProjectUrl: input.hackatimeProjectUrl,
						slackUsername: slackId,
					},
				});
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}

				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Airtable submission failed.",
				});
			}

			return projectForClient(
				await submitProjectForReview(ctx.session.user.id, input.projectId),
			);
		}),

	update: protectedProcedure
		.input(projectUpdateInput)
		.mutation(async ({ ctx, input }) => {
			const existingProject =
				input.screenshotUrl === keepExistingScreenshotValue
					? await getDraftProjectForOwner(ctx.session.user.id, input.projectId)
					: null;

			return updateProject(ctx.session.user.id, input.projectId, {
				codebaseUrl: input.codebaseUrl,
				description: input.description,
				name: input.name,
				playableUrl: input.playableUrl,
				screenshotUrl:
					input.screenshotUrl === keepExistingScreenshotValue
						? (existingProject?.screenshotUrl ?? null)
						: input.screenshotUrl,
			}).then(projectForClient);
		}),
});
