import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import type { Route } from "next";
import Link from "next/link";

import { requireLulafiSubmissionInboxSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

const PAGE_SIZE = 20;

export default async function LulafiSubmissionsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	await requireLulafiSubmissionInboxSession("/admin/submissions");

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;
	const submissions = await serverTrpcAuthed.lulafiSubmissions.list.query({
		page,
		pageSize: PAGE_SIZE,
	});
	const totalPages = Math.max(1, Math.ceil(submissions.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="LulaFi submissions"
				description="Review inbound LulaFi form submissions captured from the chat stream."
			/>
			{submissions.items.length === 0 ? (
				<EmptyState
					title="No submissions yet"
					description="New LulaFi form submissions will appear here after the server connects."
				/>
			) : (
				<div className="divide-y divide-border rounded-[calc(var(--radius)*1.05)] border border-border bg-card">
					{submissions.items.map((submission) => (
						<div
							key={submission.id}
							className="flex flex-wrap items-start justify-between gap-4 p-4"
						>
							<div className="min-w-0 space-y-1">
								<p className="font-medium text-foreground">
									{submission.formTitle ?? submission.formId ?? "Untitled form"}
								</p>
								<p className="text-muted-foreground text-sm">
									{submission.displayName ??
										submission.fromUserId ??
										"Unknown sender"}
								</p>
								<p className="text-muted-foreground text-xs">
									Submitted:{" "}
									{submission.submittedAt
										? new Date(submission.submittedAt).toLocaleString()
										: "—"}
								</p>
								<p className="text-muted-foreground text-xs">
									Event ID: {submission.externalEventId}
								</p>
							</div>
							<Button
								size="sm"
								variant="outline"
								render={
									<Link href={`/admin/submissions/${submission.id}` as Route} />
								}
							>
								View
							</Button>
						</div>
					))}
				</div>
			)}
			{totalPages > 1 ? (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href={buildPageHref(Math.max(1, page - 1))}
								aria-disabled={page <= 1}
							/>
						</PaginationItem>
						<PaginationItem>
							<span className="px-3 text-muted-foreground text-sm">
								Page {page} of {totalPages}
							</span>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext
								href={buildPageHref(Math.min(totalPages, page + 1))}
								aria-disabled={page >= totalPages}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
