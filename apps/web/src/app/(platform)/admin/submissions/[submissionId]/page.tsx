import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireLulafiSubmissionInboxSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

function getReadableFields(normalizedPayload: unknown) {
	if (
		!normalizedPayload ||
		typeof normalizedPayload !== "object" ||
		!("source" in normalizedPayload) ||
		normalizedPayload.source !== "readable" ||
		!("fields" in normalizedPayload) ||
		!Array.isArray(normalizedPayload.fields)
	) {
		return [];
	}

	return normalizedPayload.fields
		.filter((field): field is { key: string; label: string; value: string } =>
			Boolean(
				field &&
					typeof field === "object" &&
					"key" in field &&
					"label" in field &&
					"value" in field,
			),
		)
		.map((field) => ({
			key: field.key,
			label: field.label,
			value: field.value,
		}));
}

export default async function LulafiSubmissionDetailPage({
	params,
}: {
	params: Promise<{ submissionId: string }>;
}) {
	const { submissionId } = await params;
	await requireLulafiSubmissionInboxSession(
		`/admin/submissions/${submissionId}`,
	);

	const submission = await serverTrpcAuthed.lulafiSubmissions.byId.query({
		submissionId,
	});
	const readableFields = getReadableFields(submission.normalizedPayload);

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={submission.formTitle ?? submission.formId ?? "Submission detail"}
				description={
					submission.displayName ?? submission.fromUserId ?? "Unknown sender"
				}
			/>
			<FormSection
				title="Metadata"
				description="Transport and form identifiers."
			>
				<dl className="grid gap-3 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase">
							Event ID
						</dt>
						<dd className="text-sm">{submission.externalEventId}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase">Form ID</dt>
						<dd className="text-sm">{submission.formId ?? "—"}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase">
							Correlation ID
						</dt>
						<dd className="text-sm">{submission.correlationId ?? "—"}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase">Room ID</dt>
						<dd className="text-sm">{submission.roomId ?? "—"}</dd>
					</div>
				</dl>
			</FormSection>
			<FormSection
				title="Answers"
				description="Normalized readable answers when available."
			>
				{readableFields.length > 0 ? (
					<div className="grid gap-4 sm:grid-cols-2">
						{readableFields.map((field) => (
							<div
								key={field.key}
								className="rounded-lg border border-border p-3"
							>
								<p className="text-muted-foreground text-xs uppercase">
									{field.label}
								</p>
								<p className="mt-1 text-sm">{field.value || "—"}</p>
							</div>
						))}
					</div>
				) : (
					<EmptyState
						title="Readable normalization unavailable"
						description="This submission is stored with its raw payload for debugging."
					/>
				)}
			</FormSection>
			<FormSection title="Raw JSON" description="Full stored payload snapshot.">
				<pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-4 text-xs">
					{JSON.stringify(submission.rawPayload, null, 2)}
				</pre>
			</FormSection>
		</div>
	);
}
