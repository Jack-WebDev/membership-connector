import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
} from "@membership-connector-app/ui/components/pagination";
import type { Route } from "next";

import { NotificationList } from "@/components/notifications/notification-list";
import { NotificationSearch } from "@/components/notifications/notification-search";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

const PAGE_SIZE = 20;

type MemberNotificationsPageProps = {
	searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function MemberNotificationsPage({
	searchParams,
}: MemberNotificationsPageProps) {
	await requireMemberSession("/member/notifications");

	const query = await searchParams;
	const page = Number(query.page) > 0 ? Number(query.page) : 1;

	const notifications = await serverTrpcAuthed.notification.listMine.query({
		search: query.search,
		page,
		pageSize: PAGE_SIZE,
	});

	const totalPages = Math.max(1, Math.ceil(notifications.total / PAGE_SIZE));

	function buildPageHref(targetPage: number): Route {
		const params = new URLSearchParams();
		if (query.search) params.set("search", query.search);
		params.set("page", String(targetPage));
		return `?${params}` as Route;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<NotificationSearch />
			</div>
			<NotificationList notifications={notifications.items} />
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
