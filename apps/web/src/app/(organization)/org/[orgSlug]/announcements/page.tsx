import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { PlusIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { SortableHeader } from "@/components/data-table/sortable-header";
import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { AnnouncementFilters } from "./_components/announcement-filters";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	draft: "draft",
	published: "published",
	archived: "archived",
};

const VISIBILITY_LABELS: Record<string, string> = {
	public: "Public",
	members_only: "Members only",
	tier_specific: "Tier specific",
	admins_only: "Admins only",
};

const PAGE_SIZE = 20;

type OrganizationAnnouncementsPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{
		search?: string;
		status?: string;
		visibility?: string;
		membershipId?: string;
		pinned?: string;
		sortBy?: string;
		sortDir?: string;
		page?: string;
	}>;
};

export default async function OrganizationAnnouncementsPage({
	params,
	searchParams,
}: OrganizationAnnouncementsPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/announcements`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_announcements")
	) {
		return (
			<ErrorState
				title="You don't have permission to view announcements"
				description="Ask an organization owner or admin to grant you the content manager role."
			/>
		);
	}

	const canPost = hasOrganizationPermission(
		organizationAccess.role,
		"post_announcements",
	);

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;
	const sortBy = query.sortBy === "title" ? "title" : "updatedAt";
	const sortDir = query.sortDir === "asc" ? "asc" : "desc";

	const [announcements, filterOptions] = await Promise.all([
		serverTrpcAuthed.announcement.adminList.query({
			organizationSlug: orgSlug,
			search: query.search,
			status: query.status as "draft" | "published" | "archived" | undefined,
			visibility: query.visibility as
				| "public"
				| "members_only"
				| "tier_specific"
				| "admins_only"
				| undefined,
			membershipId: query.membershipId,
			pinned: query.pinned ? query.pinned === "true" : undefined,
			sortBy,
			sortDir,
			page,
			pageSize: PAGE_SIZE,
		}),
		serverTrpcAuthed.announcement.adminFilterOptions.query({
			organizationSlug: orgSlug,
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(announcements.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.visibility) params.set("visibility", query.visibility);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.pinned) params.set("pinned", query.pinned);
		if (query.sortBy) params.set("sortBy", query.sortBy);
		if (query.sortDir) params.set("sortDir", query.sortDir);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	function buildSortHref(column: "updatedAt" | "title"): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		if (query.status) params.set("status", query.status);
		if (query.visibility) params.set("visibility", query.visibility);
		if (query.membershipId) params.set("membershipId", query.membershipId);
		if (query.pinned) params.set("pinned", query.pinned);
		params.set("sortBy", column);
		params.set(
			"sortDir",
			sortBy === column && sortDir === "desc" ? "asc" : "desc",
		);
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Announcements"
				description="Compose, publish, and moderate announcements for your memberships."
				actions={
					canPost ? (
						<Button
							render={
								<Link href={`/org/${orgSlug}/announcements/new` as Route} />
							}
						>
							<PlusIcon />
							New announcement
						</Button>
					) : undefined
				}
			/>

			<AnnouncementFilters memberships={filterOptions.memberships} />

			<DataTable
				title="All announcements"
				description={`Showing ${announcements.items.length} of ${announcements.total} announcements`}
				columns={[
					{
						id: "title",
						header: (
							<SortableHeader
								label="Title"
								href={buildSortHref("title")}
								active={sortBy === "title"}
								direction={sortDir}
							/>
						),
						cell: (row) => (
							<div className="space-y-0.5">
								<div className="font-medium text-foreground">{row.title}</div>
								<div className="text-muted-foreground text-xs">
									{row.membershipName}
								</div>
							</div>
						),
					},
					{
						id: "status",
						header: "Status",
						cell: (row) => (
							<StatusBadge
								label={row.status}
								tone={STATUS_TONES[row.status] ?? "muted"}
							/>
						),
					},
					{
						id: "visibility",
						header: "Visibility",
						cell: (row) => VISIBILITY_LABELS[row.visibility] ?? row.visibility,
					},
					{
						id: "pinned",
						header: "Pinned",
						cell: (row) => (row.pinned ? "Yes" : "—"),
					},
					{
						id: "engagement",
						header: "Likes / Comments",
						cell: (row) => `${row.likesCount} / ${row.commentsCount}`,
					},
					{
						id: "updated",
						header: (
							<SortableHeader
								label="Updated"
								href={buildSortHref("updatedAt")}
								active={sortBy === "updatedAt"}
								direction={sortDir}
							/>
						),
						cell: (row) => new Date(row.updatedAt).toLocaleDateString(),
					},
				]}
				rows={announcements.items}
				rowKey={(row) => row.id}
				actions={(row) => (
					<Button
						size="sm"
						variant="outline"
						render={
							<Link href={`/org/${orgSlug}/announcements/${row.id}` as Route} />
						}
					>
						View
					</Button>
				)}
				emptyTitle="No announcements yet"
				emptyDescription="Create your first announcement to keep members in the loop."
				pagination={
					totalPages > 1 ? (
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
					) : undefined
				}
			/>
		</div>
	);
}
