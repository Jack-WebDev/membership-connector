import { AnnouncementCard } from "@membership-connector-app/ui/components/announcement-card";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { MembershipCard } from "@membership-connector-app/ui/components/membership-card";
import { StatCard } from "@membership-connector-app/ui/components/stat-card";
import {
	BadgeCheckIcon,
	BookmarkIcon,
	CheckCircle2Icon,
	ClockIcon,
	XCircleIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { toMembershipCardProps } from "@/lib/membership-presenters";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

export default async function MemberDashboardPage() {
	await requireMemberSession("/member/dashboard");

	const [summary, recentAnnouncements, recommended, applications, memberships] =
		await Promise.all([
			serverTrpcAuthed.membershipMember.dashboardSummary.query(),
			serverTrpcAuthed.announcement.listRecentForUser.query(),
			serverTrpcAuthed.membership.listPublic.query({
				sort: "newest",
				limit: 3,
			}),
			serverTrpcAuthed.membershipApplication.listMine.query(),
			serverTrpcAuthed.membershipMember.listMine.query(),
		]);

	const activity = [
		...applications.map((application) => ({
			id: `application-${application.id}`,
			label: `${application.membershipName} application ${application.status.replace("_", " ")}`,
			timestamp: application.updatedAt,
			href: `/member/applications/${application.id}` as Route,
		})),
		...memberships.map((membership) => ({
			id: `membership-${membership.id}`,
			label: `${membership.membershipName} membership ${membership.status.replace("_", " ")}`,
			timestamp: membership.startedAt,
			href: `/member/memberships/${membership.membershipId}` as Route,
		})),
	]
		.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		)
		.slice(0, 5);

	return (
		<div className="space-y-6">
			<DashboardHeader
				title="Dashboard"
				description="A snapshot of your applications, active memberships, and what's new."
			/>

			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
				<StatCard
					label="Active memberships"
					value={summary.activeMemberships}
					icon={<BadgeCheckIcon />}
				/>
				<StatCard
					label="Pending applications"
					value={summary.pendingApplications}
					icon={<ClockIcon />}
				/>
				<StatCard
					label="Approved"
					value={summary.approvedApplications}
					icon={<CheckCircle2Icon />}
				/>
				<StatCard
					label="Rejected"
					value={summary.rejectedApplications}
					icon={<XCircleIcon />}
				/>
				<StatCard
					label="Saved"
					value={summary.savedMemberships}
					icon={<BookmarkIcon />}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="space-y-6">
					<section className="space-y-4">
						<h2 className="font-(family-name:--font-display) text-2xl text-foreground">
							Latest announcements
						</h2>
						{recentAnnouncements.length > 0 ? (
							<div className="space-y-4">
								{recentAnnouncements.map((announcement) => (
									<AnnouncementCard
										key={announcement.id}
										title={announcement.title}
										body={announcement.body}
										authorName={announcement.authorName}
										publishedAt={new Date(
											announcement.publishedAt,
										).toLocaleDateString()}
										visibilityLabel={announcement.visibilityLabel}
										pinned={announcement.pinned}
										likes={announcement.likesCount}
										comments={announcement.commentsCount}
									/>
								))}
							</div>
						) : (
							<EmptyState
								title="No announcements yet"
								description="Announcements from memberships you've joined will show up here."
							/>
						)}
					</section>

					<section className="space-y-4">
						<h2 className="font-(family-name:--font-display) text-2xl text-foreground">
							Recommended for you
						</h2>
						{recommended.length > 0 ? (
							<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
								{recommended.map((membership) => (
									<MembershipCard
										key={membership.id}
										{...toMembershipCardProps(membership, {
											href: `/organizations/${membership.organizationSlug}/memberships/${membership.slug}`,
										})}
									/>
								))}
							</div>
						) : (
							<EmptyState
								title="Nothing new right now"
								description="Check back soon for new memberships to explore."
							/>
						)}
					</section>
				</div>

				<div className="space-y-4">
					<h2 className="font-(family-name:--font-display) text-2xl text-foreground">
						Recent activity
					</h2>
					{activity.length > 0 ? (
						<ul className="space-y-3">
							{activity.map((item) => (
								<li key={item.id}>
									<Link
										href={item.href}
										className="block rounded-[calc(var(--radius)*1.1)] border border-border/80 bg-card/90 p-4 text-sm shadow-[var(--shadow-card)] transition-colors hover:border-primary/30"
									>
										<div className="text-foreground">{item.label}</div>
										<div className="mt-1 text-muted-foreground text-xs">
											{new Date(item.timestamp).toLocaleDateString()}
										</div>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<EmptyState
							title="No activity yet"
							description="Apply to a membership to see your activity here."
						/>
					)}
				</div>
			</div>
		</div>
	);
}
