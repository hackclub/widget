import "server-only";

import postgres from "postgres";

import { env } from "~/env";
import type { Session } from "~/server/auth";

export type Project = {
	codebaseUrl: string;
	createdAt: string;
	description: string;
	hackClubInfo: string;
	id: string;
	name: string;
	ownerId: string;
	playableUrl: string;
	screenshotUrl: string | null;
	status: ProjectStatus;
	updatedAt: string;
};

export type ProjectStatus =
	| "draft"
	| "pending"
	| "pending_hq"
	| "approved"
	| "rejected";

export type TimelineEvent = {
	[key: string]: unknown;
	actorId: string;
	id: string;
	shipId: string;
	timestamp: string;
	type: string;
};

export type SidekickProject = {
	authorId: string;
	codeUrl: string;
	demoUrl?: string;
	description: string;
	hackatimeProjectKeys: string[];
	id: string;
	metadata: Record<string, unknown>;
	screenshotUrl?: string;
	ships: Array<{
		hoursSubmitted: number;
		id: string;
		status: "pending" | "pending_hq" | "approved" | "rejected";
		submittedAt: string;
	}>;
	title: string;
};

const globalForPostgres = globalThis as unknown as {
	widgetDatabase?: ReturnType<typeof postgres>;
	widgetDatabaseReady?: Promise<void>;
};

const sql =
	globalForPostgres.widgetDatabase ??
	postgres(getPostgresUrl(), {
		max: 5,
		prepare: false,
	});

globalForPostgres.widgetDatabase = sql;

function getPostgresUrl() {
	let url: URL;

	try {
		url = new URL(env.POSTGRES_URL);
	} catch (error) {
		if (process.env.SKIP_ENV_VALIDATION) {
			url = new URL("postgresql://build:build@localhost:5432/build");
		} else {
			throw error;
		}
	}

	url.searchParams.delete("sslrootcert");

	return url.toString();
}

function databaseReady() {
	globalForPostgres.widgetDatabaseReady ??= initializeDatabase();

	return globalForPostgres.widgetDatabaseReady;
}

async function initializeDatabase() {
	await sql`
		CREATE TABLE IF NOT EXISTS widget_sessions (
			id TEXT PRIMARY KEY,
			access_token TEXT NOT NULL,
			refresh_token TEXT,
			user_id TEXT NOT NULL,
			user_email TEXT,
			user_name TEXT NOT NULL,
			user_slack_id TEXT,
			created_at TIMESTAMPTZ NOT NULL,
			expires_at TIMESTAMPTZ NOT NULL
		)
	`;

	await sql`
		CREATE TABLE IF NOT EXISTS widget_projects (
			id UUID PRIMARY KEY,
			owner_id TEXT NOT NULL,
			name TEXT NOT NULL,
			playable_url TEXT NOT NULL,
			codebase_url TEXT NOT NULL,
			screenshot_url TEXT,
			description TEXT NOT NULL,
			hack_club_info TEXT NOT NULL,
			status TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL
		)
	`;

	await sql`
		CREATE TABLE IF NOT EXISTS widget_timeline_events (
			id UUID PRIMARY KEY,
			project_id UUID NOT NULL REFERENCES widget_projects(id) ON DELETE CASCADE,
			ship_id TEXT NOT NULL,
			type TEXT NOT NULL,
			actor_id TEXT NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL,
			event JSONB NOT NULL
		)
	`;

	await sql`
		DO $$
		DECLARE constraint_name TEXT;
		BEGIN
			SELECT conname INTO constraint_name
			FROM pg_constraint
			WHERE conrelid = 'widget_projects'::regclass
				AND contype = 'c'
				AND pg_get_constraintdef(oid) LIKE '%status%';

			IF constraint_name IS NOT NULL THEN
				EXECUTE 'ALTER TABLE widget_projects DROP CONSTRAINT ' || quote_ident(constraint_name);
			END IF;
		END $$;
	`;

	await sql`
		UPDATE widget_projects
		SET status = 'pending'
		WHERE status = 'submitted'
	`;

	await sql`
		ALTER TABLE widget_projects
		ADD CONSTRAINT widget_projects_status_check
		CHECK (status IN ('draft', 'pending', 'pending_hq', 'approved', 'rejected'))
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS widget_projects_owner_updated_idx
		ON widget_projects (owner_id, updated_at DESC)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS widget_sessions_expires_idx
		ON widget_sessions (expires_at)
	`;

	await sql`
		CREATE INDEX IF NOT EXISTS widget_timeline_events_project_timestamp_idx
		ON widget_timeline_events (project_id, timestamp ASC)
	`;
}

export async function saveSession(sessionId: string, session: Session) {
	await databaseReady();

	await sql`
		INSERT INTO widget_sessions (
			id,
			access_token,
			refresh_token,
			user_id,
			user_email,
			user_name,
			user_slack_id,
			created_at,
			expires_at
		)
		VALUES (
			${sessionId},
			${session.accessToken},
			${session.refreshToken},
			${session.user.id},
			${session.user.email},
			${session.user.name},
			${session.user.slackId},
			${session.createdAt},
			${session.expiresAt}
		)
		ON CONFLICT (id) DO UPDATE SET
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			user_id = EXCLUDED.user_id,
			user_email = EXCLUDED.user_email,
			user_name = EXCLUDED.user_name,
			user_slack_id = EXCLUDED.user_slack_id,
			created_at = EXCLUDED.created_at,
			expires_at = EXCLUDED.expires_at
	`;
}

export async function getSession(sessionId: string) {
	await databaseReady();

	const sessions = await sql<
		{
			access_token: string;
			created_at: Date;
			expires_at: Date;
			refresh_token: string | null;
			user_email: string | null;
			user_id: string;
			user_name: string;
			user_slack_id: string | null;
		}[]
	>`
		SELECT
			access_token,
			refresh_token,
			user_id,
			user_email,
			user_name,
			user_slack_id,
			created_at,
			expires_at
		FROM widget_sessions
		WHERE id = ${sessionId}
		LIMIT 1
	`;
	const session = sessions[0];

	if (!session) {
		return null;
	}

	return {
		accessToken: session.access_token,
		createdAt: session.created_at.toISOString(),
		expiresAt: session.expires_at.toISOString(),
		refreshToken: session.refresh_token,
		user: {
			email: session.user_email,
			id: session.user_id,
			name: session.user_name,
			slackId: session.user_slack_id,
		},
	} satisfies Session;
}

export async function deleteSession(sessionId: string) {
	await databaseReady();

	await sql`
		DELETE FROM widget_sessions
		WHERE id = ${sessionId}
	`;
}

export async function createProject(project: Project) {
	await databaseReady();

	await sql`
		INSERT INTO widget_projects (
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		)
		VALUES (
			${project.id},
			${project.ownerId},
			${project.name},
			${project.playableUrl},
			${project.codebaseUrl},
			${project.screenshotUrl},
			${project.description},
			${project.hackClubInfo},
			${project.status},
			${project.createdAt},
			${project.updatedAt}
		)
	`;

	return project;
}

export async function updateProject(
	ownerId: string,
	projectId: string,
	input: {
		codebaseUrl: string;
		description: string;
		name: string;
		playableUrl: string;
		screenshotUrl: string | null;
	},
) {
	await databaseReady();

	const now = new Date().toISOString();
	const rows = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		UPDATE widget_projects
		SET
			name = ${input.name},
			playable_url = ${input.playableUrl},
			codebase_url = ${input.codebaseUrl},
			screenshot_url = ${input.screenshotUrl},
			description = ${input.description},
			updated_at = ${now}
		WHERE id = ${projectId}
			AND owner_id = ${ownerId}
			AND status = 'draft'
		RETURNING
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
	`;

	return rows[0] ? rowToProject(rows[0]) : null;
}

export async function submitProjectForReview(
	ownerId: string,
	projectId: string,
) {
	await databaseReady();

	const now = new Date().toISOString();
	const rows = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		UPDATE widget_projects
		SET status = 'pending', updated_at = ${now}
		WHERE id = ${projectId}
			AND owner_id = ${ownerId}
			AND status = 'draft'
		RETURNING
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
	`;

	return rows[0] ? rowToProject(rows[0]) : null;
}

export async function getDraftProjectForOwner(
	ownerId: string,
	projectId: string,
) {
	await databaseReady();

	const projects = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		SELECT
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		FROM widget_projects
		WHERE id = ${projectId}
			AND owner_id = ${ownerId}
			AND status = 'draft'
		LIMIT 1
	`;

	return projects[0] ? rowToProject(projects[0]) : null;
}

function projectShipId(projectId: string) {
	return `ship_${projectId}`;
}

function toSidekickProject(project: Project): SidekickProject {
	const submittedAt = project.createdAt;
	const status = project.status === "draft" ? "pending" : project.status;

	return {
		authorId: project.ownerId,
		codeUrl: project.codebaseUrl,
		demoUrl: project.playableUrl,
		description: project.description,
		hackatimeProjectKeys: [],
		id: project.id,
		metadata: {
			hackClubInfo: project.hackClubInfo,
			widgetStatus: project.status,
		},
		...(project.screenshotUrl ? { screenshotUrl: project.screenshotUrl } : {}),
		ships:
			project.status === "draft"
				? []
				: [
						{
							hoursSubmitted: 0,
							id: projectShipId(project.id),
							status,
							submittedAt,
						},
					],
		title: project.name,
	};
}

function rowToProject(project: {
	codebase_url: string;
	created_at: Date;
	description: string;
	hack_club_info: string;
	id: string;
	name: string;
	owner_id: string;
	playable_url: string;
	screenshot_url: string | null;
	status: ProjectStatus;
	updated_at: Date;
}): Project {
	return {
		codebaseUrl: project.codebase_url,
		createdAt: project.created_at.toISOString(),
		description: project.description,
		hackClubInfo: project.hack_club_info,
		id: project.id,
		name: project.name,
		ownerId: project.owner_id,
		playableUrl: project.playable_url,
		screenshotUrl: project.screenshot_url,
		status: project.status,
		updatedAt: project.updated_at.toISOString(),
	};
}

function parseTimelineEvent(event: unknown): TimelineEvent {
	if (typeof event === "string") {
		return JSON.parse(event) as TimelineEvent;
	}

	return event as TimelineEvent;
}

export async function listProjectsForOwner(ownerId: string) {
	await databaseReady();

	const projects = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		SELECT
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		FROM widget_projects
		WHERE owner_id = ${ownerId}
		ORDER BY updated_at DESC
		LIMIT 100
	`;

	return projects.map(rowToProject);
}

export async function getSidekickStats() {
	await databaseReady();

	const [stats] = await sql<
		{ pending_hq_count: string; pending_review_count: string }[]
	>`
		SELECT
			COUNT(*) FILTER (WHERE status = 'pending') AS pending_review_count,
			COUNT(*) FILTER (WHERE status = 'pending_hq') AS pending_hq_count
		FROM widget_projects
	`;

	return {
		pendingFulfillmentCount: 0,
		pendingHqCount: Number(stats?.pending_hq_count ?? 0),
		pendingReviewCount: Number(stats?.pending_review_count ?? 0),
	};
}

export async function listSidekickProjects(input: {
	cursor?: string | null;
	limit?: number;
	status?: string;
}) {
	await databaseReady();

	const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
	const offset = input.cursor ? Number.parseInt(input.cursor, 10) : 0;
	const status = input.status ?? "all";

	const statusFilter =
		status === "all" ? sql`status != 'draft'` : sql`status = ${status}`;

	const countRows = await sql<{ count: string }[]>`
		SELECT COUNT(*) AS count
		FROM widget_projects
		WHERE ${statusFilter}
	`;
	const totalCount = Number(countRows[0]?.count ?? 0);
	const rows = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		SELECT
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		FROM widget_projects
		WHERE ${statusFilter}
		ORDER BY updated_at DESC
		LIMIT ${limit}
		OFFSET ${offset}
	`;
	const nextOffset = offset + rows.length;
	return {
		nextCursor: nextOffset < totalCount ? String(nextOffset) : undefined,
		projects: rows.map(rowToProject).map(toSidekickProject),
		totalCount,
	};
}

export async function getSidekickProject(projectId: string) {
	await databaseReady();

	const rows = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		SELECT
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		FROM widget_projects
		WHERE id = ${projectId}
		LIMIT 1
	`;
	const project = rows[0];

	return project ? toSidekickProject(rowToProject(project)) : null;
}

export async function listSidekickProjectsByAuthor(input: {
	authorId: string;
	excludeProjectId?: string;
}) {
	await databaseReady();

	const rows = await sql<
		{
			codebase_url: string;
			created_at: Date;
			description: string;
			hack_club_info: string;
			id: string;
			name: string;
			owner_id: string;
			playable_url: string;
			screenshot_url: string | null;
			status: ProjectStatus;
			updated_at: Date;
		}[]
	>`
		SELECT
			id,
			owner_id,
			name,
			playable_url,
			codebase_url,
			screenshot_url,
			description,
			hack_club_info,
			status,
			created_at,
			updated_at
		FROM widget_projects
		WHERE owner_id = ${input.authorId}
			AND (${input.excludeProjectId ?? null}::uuid IS NULL OR id != ${input.excludeProjectId ?? null}::uuid)
		ORDER BY updated_at DESC
		LIMIT 25
	`;

	return { projects: rows.map(rowToProject).map(toSidekickProject) };
}

async function getProjectByShipId(shipId: string) {
	const projectId = shipId.startsWith("ship_") ? shipId.slice(5) : shipId;
	const project = await getSidekickProject(projectId);

	return project;
}

export async function listProjectTimeline(projectId: string) {
	await databaseReady();

	const project = await getSidekickProject(projectId);

	if (!project) {
		return null;
	}

	const events = await sql<{ event: unknown }[]>`
		SELECT event
		FROM widget_timeline_events
		WHERE project_id = ${projectId}
		ORDER BY timestamp ASC
	`;

	return {
		events: [
			...project.ships.map((ship) => ({
				actorId: project.authorId,
				hoursSubmitted: ship.hoursSubmitted,
				id: `evt_${ship.id}`,
				shipId: ship.id,
				timestamp: ship.submittedAt,
				type: "ship",
			})),
			...events.map((event) => parseTimelineEvent(event.event)),
		],
	};
}

export async function submitSidekickReviewAction(input: {
	[key: string]: unknown;
	action: string;
	reviewerId: string;
	shipId: string;
}) {
	await databaseReady();

	const project = await getProjectByShipId(input.shipId);

	if (!project) {
		return null;
	}

	const eventId = crypto.randomUUID();
	const timestamp = new Date().toISOString();
	const baseEvent = {
		actorId: input.reviewerId,
		id: eventId,
		shipId: input.shipId,
		timestamp,
	};
	let event: TimelineEvent;
	let status: ProjectStatus | null = null;

	if (input.action === "approve") {
		status = input.isHq === false ? "pending_hq" : "approved";
		event = {
			...baseEvent,
			feedbackMessage: String(input.feedbackMessage ?? ""),
			fields: input.fields ?? {},
			hoursAssigned: Number(input.hoursAssigned ?? 0),
			justification: String(input.justification ?? ""),
			rewardedHoursOverride: input.rewardedHoursOverride,
			type: "approval",
		};
	} else if (input.action === "reject") {
		status = "rejected";
		event = {
			...baseEvent,
			feedbackMessage: String(input.feedbackMessage ?? ""),
			fields: input.fields ?? {},
			internalMessage: input.internalMessage,
			type: "rejection",
		};
	} else if (
		input.action === "comment" ||
		input.action === "internal_comment"
	) {
		event = {
			...baseEvent,
			isInternal: input.action === "internal_comment",
			text: String(input.commentText ?? ""),
			type: "comment",
		};
	} else if (input.action === "authorize") {
		status = "approved";
		event = {
			...baseEvent,
			hoursAssigned: Number(input.hoursAssigned ?? 0),
			justification: String(input.justification ?? ""),
			rewardedHoursOverride: input.rewardedHoursOverride,
			type: "approval",
		};
	} else if (input.action === "deauthorize") {
		status = "pending";
		event = {
			...baseEvent,
			isInternal: true,
			text: String(input.message ?? "Returned for review."),
			type: "comment",
		};
	} else {
		throw new Error("Unsupported review action.");
	}

	if (status) {
		await sql`
			UPDATE widget_projects
			SET status = ${status}, updated_at = ${timestamp}
			WHERE id = ${project.id}
		`;
	}

	await sql`
		INSERT INTO widget_timeline_events (
			id,
			project_id,
			ship_id,
			type,
			actor_id,
			timestamp,
			event
		)
		VALUES (
			${eventId},
			${project.id},
			${input.shipId},
			${event.type},
			${input.reviewerId},
			${timestamp},
			${JSON.stringify(event)}::jsonb
		)
	`;

	return event;
}

export async function updateSidekickReviewAction(input: {
	[key: string]: unknown;
	reviewerId: string;
	shipId: string;
	type: "approval" | "rejection";
}) {
	await databaseReady();

	const project = await getProjectByShipId(input.shipId);

	if (!project) {
		return false;
	}

	const [row] = await sql<{ event: unknown; id: string }[]>`
		SELECT id, event
		FROM widget_timeline_events
		WHERE ship_id = ${input.shipId}
			AND actor_id = ${input.reviewerId}
			AND type = ${input.type}
		ORDER BY timestamp DESC
		LIMIT 1
	`;

	if (!row) {
		return false;
	}

	const existingEvent = parseTimelineEvent(row.event);
	const event = {
		...existingEvent,
		feedbackMessage: input.feedbackMessage ?? existingEvent.feedbackMessage,
		fields: input.fields ?? existingEvent.fields,
		hoursAssigned: input.hoursAssigned ?? existingEvent.hoursAssigned,
		internalMessage: input.internalMessage ?? existingEvent.internalMessage,
		justification: input.justification ?? existingEvent.justification,
		rewardedHoursOverride:
			input.rewardedHoursOverride ?? existingEvent.rewardedHoursOverride,
	};

	await sql`
		UPDATE widget_timeline_events
	SET event = ${JSON.stringify(event)}::jsonb
		WHERE id = ${row.id}
	`;

	return true;
}
