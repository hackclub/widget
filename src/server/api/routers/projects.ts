import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	createProject,
	listProjectsForOwner,
	type Project,
} from "~/server/postgres-store";

const urlSchema = z.string().url().max(500);

const projectInput = z.object({
	codebaseUrl: urlSchema,
	description: z.string().min(20).max(700),
	hackClubInfo: z.string().min(10).max(700),
	name: z.string().min(2).max(80),
	playableUrl: urlSchema,
	screenshotUrl: z.union([urlSchema, z.literal("")]).transform((value) => {
		return value === "" ? null : value;
	}),
	status: z.enum(["draft", "submitted"]),
});

export const projectsRouter = createTRPCRouter({
	create: protectedProcedure
		.input(projectInput)
		.mutation(async ({ ctx, input }) => {
			const now = new Date().toISOString();
			const project: Project = {
				...input,
				id: crypto.randomUUID(),
				ownerId: ctx.session.user.id,
				createdAt: now,
				status: input.status === "submitted" ? "pending" : "draft",
				updatedAt: now,
			};

			return createProject(project);
		}),

	listMine: protectedProcedure.query(({ ctx }) => {
		return listProjectsForOwner(ctx.session.user.id);
	}),
});
