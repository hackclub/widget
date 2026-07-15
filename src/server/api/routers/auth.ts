import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
	me: publicProcedure.query(({ ctx }) => {
		return ctx.session
			? {
					expiresAt: ctx.session.expiresAt,
					user: ctx.session.user,
				}
			: null;
	}),
});
