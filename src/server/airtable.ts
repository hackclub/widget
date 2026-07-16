import "server-only";

import { env } from "~/env";
import type { SubmissionIdentity } from "~/server/auth";
import type { Project } from "~/server/postgres-store";

const defaultBaseId = "appvgpfBHoo5iG8ZP";
const defaultTableId = "tblL2k1AGLrLCdPQ2";
const screenshotFieldName = "Screenshot";

export type AirtableSubmissionInput = {
	estimatedHoursSpent: number;
	githubUsername: string;
	hackatimeProjectUrl: string;
	slackUsername: string;
};

export async function createAirtableProjectSubmission(input: {
	identity: SubmissionIdentity;
	project: Project;
	submission: AirtableSubmissionInput;
}) {
	if (!env.AIRTABLE_TOKEN) {
		throw new Error("AIRTABLE_TOKEN is not configured.");
	}

	validateIdentity(input.identity);

	const baseId = env.AIRTABLE_BASE_ID ?? defaultBaseId;
	const tableId = env.AIRTABLE_TABLE_ID ?? defaultTableId;
	const response = await fetch(
		`https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`,
		{
			body: JSON.stringify({
				records: [
					{
						fields: airtableFields(input),
					},
				],
			}),
			headers: {
				authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
				"content-type": "application/json",
			},
			method: "POST",
		},
	);

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Airtable submission failed: ${message}`);
	}

	const createdRecord = (await response.json()) as {
		records?: Array<{ id?: string }>;
	};
	const recordId = createdRecord.records?.[0]?.id;

	if (!recordId) {
		throw new Error("Airtable submission failed: missing created record ID.");
	}

	if (input.project.screenshotUrl?.startsWith("data:image/")) {
		await uploadAirtableScreenshot({
			baseId,
			recordId,
			screenshotDataUrl: input.project.screenshotUrl,
		});
	}
}

function validateIdentity(identity: SubmissionIdentity) {
	const missingFields = [
		["First Name", identity.firstName],
		["Email", identity.email],
		["Birthday", identity.birthday],
		["Address (Line 1)", identity.addressLine1],
		["City", identity.city],
		["Country", identity.country],
		["ZIP / Postal Code", identity.postalCode],
	].flatMap(([fieldName, value]) => (value ? [] : [fieldName]));

	if (missingFields.length > 0) {
		throw new Error(
			`Hack Club Auth did not return required Airtable fields: ${missingFields.join(", ")}.`,
		);
	}
}

function airtableFields(input: {
	identity: SubmissionIdentity;
	project: Project;
	submission: AirtableSubmissionInput;
}) {
	const { identity, project, submission } = input;
	const fields: Record<string, unknown> = {
		"Code URL": project.codebaseUrl,
		Description: project.description,
		"Estimated Hours Spent": submission.estimatedHoursSpent,
		"GitHub Username": submission.githubUsername,
		"Hackatime Project URL": submission.hackatimeProjectUrl,
		"Playable URL": project.playableUrl,
		"Slack Username": submission.slackUsername,
	};

	addIfPresent(fields, "Address (Line 1)", identity.addressLine1);
	addIfPresent(fields, "Address (Line 2)", identity.addressLine2);
	addIfPresent(fields, "Birthday", identity.birthday);
	addIfPresent(fields, "City", identity.city);
	addIfPresent(fields, "Country", identity.country);
	addIfPresent(fields, "Email", identity.email);
	addIfPresent(fields, "First Name", identity.firstName);
	addIfPresent(fields, "Last Name", identity.lastName);
	addIfPresent(fields, "State / Province", identity.stateOrProvince);
	addIfPresent(fields, "ZIP / Postal Code", identity.postalCode);

	if (
		project.screenshotUrl &&
		!project.screenshotUrl.startsWith("data:image/")
	) {
		fields[screenshotFieldName] = [{ url: project.screenshotUrl }];
	}

	return fields;
}

async function uploadAirtableScreenshot(input: {
	baseId: string;
	recordId: string;
	screenshotDataUrl: string;
}) {
	const screenshot = parseScreenshotDataUrl(input.screenshotDataUrl);
	const response = await fetch(
		`https://content.airtable.com/v0/${encodeURIComponent(input.baseId)}/${encodeURIComponent(input.recordId)}/${encodeURIComponent(screenshotFieldName)}/uploadAttachment`,
		{
			body: JSON.stringify({
				contentType: screenshot.contentType,
				file: screenshot.base64,
				filename: screenshot.filename,
			}),
			headers: {
				authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
				"content-type": "application/json",
			},
			method: "POST",
		},
	);

	if (!response.ok) {
		const message = await response.text();
		throw new Error(`Airtable screenshot upload failed: ${message}`);
	}
}

function parseScreenshotDataUrl(dataUrl: string) {
	const match = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i.exec(
		dataUrl,
	);

	if (!match?.[1] || !match[2]) {
		throw new Error("Uploaded screenshot is not a supported image.");
	}

	return {
		base64: match[2],
		contentType: match[1].toLowerCase(),
		filename: `widget-screenshot.${extensionForContentType(match[1])}`,
	};
}

function extensionForContentType(contentType: string) {
	switch (contentType.toLowerCase()) {
		case "image/jpeg":
		case "image/jpg":
			return "jpg";
		case "image/webp":
			return "webp";
		case "image/gif":
			return "gif";
		default:
			return "png";
	}
}

function addIfPresent(
	fields: Record<string, unknown>,
	fieldName: string,
	value: string | null,
) {
	if (value) {
		fields[fieldName] = value;
	}
}
