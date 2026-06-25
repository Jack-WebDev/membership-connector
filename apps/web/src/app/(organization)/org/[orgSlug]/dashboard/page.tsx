import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { StatCard } from "@membership-connector-app/ui/components/stat-card";
import {
	BadgeCheckIcon,
	BanknoteIcon,
	CheckCircle2Icon,
	ClockIcon,
	MegaphoneIcon,
	PauseCircleIcon,
	XCircleIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

type QuickAction = {
	label: string;
	href: Route;
};

function ActivityList({
	title,
	emptyTitle,
	emptyDescription,
	items,
}: {
	title: string;
	emptyTitle: string;
	emptyDescription: string;
	items: {
		id: string;
		label: string;
		meta: string;
		timestamp: Date | string | null;
	}[];
}) {
	return (
		<section className="space-y-3">
			<h2 className="font-(family-name:--font-display) text-foreground text-xl">
				{title}
			</h2>
			{items.length > 0 ? (
				<ul className="space-y-2">
					{items.map((item) => (
						<li
							key={item.id}
							className="rounded-[calc(var(--radius)*1.1)] border border-border/80 bg-card/90 p-4 text-sm shadow-[var(--shadow-card)]"
						>
							<div className="text-foreground">{item.label}</div>
							<div className="mt-1 flex items-center justify-between text-muted-foreground text-xs">
								<span>{item.meta}</span>
								<span>
									{item.timestamp
										? new Date(item.timestamp).toLocaleDateString()
										: "—"}
								</span>
							</div>
						</li>
					))}
				</ul>
			) : (
				<EmptyState title={emptyTitle} description={emptyDescription} />
			)}
		</section>
	);
}

type OrganizationDashboardPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function OrganizationDashboardPage({
	params,
}: OrganizationDashboardPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/dashboard`,
	);

	if (
		!hasOrganizationPermission(
			organizationAccess.role,
			"view_organization_dashboard",
		)
	) {
		return (
			<ErrorState
				title="You don't have permission to view this dashboard"
				description="Ask an organization owner or admin for access."
			/>
		);
	}

	const overview = await serverTrpcAuthed.organization.adminDashboard.query({
		organizationSlug: orgSlug,
	});

	const quickActions: QuickAction[] = [];

	if (
		hasOrganizationPermission(organizationAccess.role, "manage_memberships")
	) {
		quickActions.push(
			{
				label: "Create membership",
				href: `/org/${orgSlug}/memberships/new` as Route,
			},
			{
				label: "Create tier",
				href: `/org/${orgSlug}/membership-tiers/new` as Route,
			},
		);
	}

	if (
		hasOrganizationPermission(organizationAccess.role, "review_applications")
	) {
		quickActions.push({
			label: "Review applications",
			href: `/org/${orgSlug}/applications` as Route,
		});
	}

	if (
		hasOrganizationPermission(organizationAccess.role, "post_announcements") ||
		hasOrganizationPermission(organizationAccess.role, "manage_announcements")
	) {
		quickActions.push({
			label: "Post announcement",
			href: `/org/${orgSlug}/announcements` as Route,
		});
	}

	if (hasOrganizationPermission(organizationAccess.role, "invite_admins")) {
		quickActions.push({
			label: "Invite admin",
			href: `/org/${orgSlug}/admins` as Route,
		});
	}

	if (
		hasOrganizationPermission(organizationAccess.role, "manage_finance_records")
	) {
		quickActions.push({
			label: "Record finance transaction",
			href: `/org/${orgSlug}/finances` as Route,
		});
	}

	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
				<StatCard
					label="Active members"
					value={overview.activeMembers}
					icon={<BadgeCheckIcon />}
				/>
				<StatCard
					label="Pending applications"
					value={overview.pendingApplications}
					icon={<ClockIcon />}
				/>
				<StatCard
					label="Approved applications"
					value={overview.approvedApplications}
					icon={<CheckCircle2Icon />}
				/>
				<StatCard
					label="Rejected applications"
					value={overview.rejectedApplications}
					icon={<XCircleIcon />}
				/>
				<StatCard
					label="Published memberships"
					value={overview.publishedMemberships}
					icon={<MegaphoneIcon />}
				/>
				<StatCard
					label="Paused memberships"
					value={overview.pausedMemberships}
					icon={<PauseCircleIcon />}
				/>
				<StatCard
					label="Monthly demo revenue"
					value={`${overview.currency} ${overview.monthlyRevenue}`}
					icon={<BanknoteIcon />}
				/>
			</div>

			{quickActions.length > 0 ? (
				<section className="space-y-3">
					<h2 className="font-(family-name:--font-display) text-foreground text-xl">
						Quick actions
					</h2>
					<div className="flex flex-wrap gap-2">
						{quickActions.map((action) => (
							<Button
								key={action.href}
								variant="outline"
								render={<Link href={action.href} />}
							>
								{action.label}
							</Button>
						))}
					</div>
				</section>
			) : null}

			<div className="grid gap-6 md:grid-cols-2">
				<ActivityList
					title="Recent applications"
					emptyTitle="No applications yet"
					emptyDescription="Submitted applications will appear here."
					items={overview.recentApplications.map((application) => ({
						id: application.id,
						label: `${application.applicantName} applied to ${application.membershipName}`,
						meta: application.status.replace("_", " "),
						timestamp: application.submittedAt,
					}))}
				/>
				<ActivityList
					title="Recent members"
					emptyTitle="No members yet"
					emptyDescription="New active members will appear here."
					items={overview.recentMembers.map((member) => ({
						id: member.id,
						label: `${member.userName} joined ${member.membershipName}`,
						meta: member.status.replace("_", " "),
						timestamp: member.startedAt,
					}))}
				/>
				<ActivityList
					title="Recent comments"
					emptyTitle="No comments yet"
					emptyDescription="Member comments on announcements will appear here."
					items={overview.recentComments.map((comment) => ({
						id: comment.id,
						label: `${comment.userName} commented on ${comment.announcementTitle}`,
						meta: comment.body,
						timestamp: comment.createdAt,
					}))}
				/>
				<ActivityList
					title="Recent finance records"
					emptyTitle="No finance records yet"
					emptyDescription="Demo finance transactions will appear here."
					items={overview.recentFinanceRecords.map((record) => ({
						id: record.id,
						label: `${record.type.replace("_", " ")} · ${record.currency} ${record.amount}`,
						meta: record.status,
						timestamp: record.createdAt,
					}))}
				/>
			</div>
		</div>
	);
}
