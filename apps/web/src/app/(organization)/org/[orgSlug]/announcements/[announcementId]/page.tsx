import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { AnnouncementStatusActions } from "./_components/announcement-status-actions";
import { CommentModerationList } from "./_components/comment-moderation-list";

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

type OrganizationAnnouncementDetailPageProps = {
	params: Promise<{ orgSlug: string; announcementId: string }>;
};

export default async function OrganizationAnnouncementDetailPage({
	params,
}: OrganizationAnnouncementDetailPageProps) {
	const { orgSlug, announcementId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/announcements/${announcementId}`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_announcements")
	) {
		return (
			<ErrorState
				title="You don't have permission to view this announcement"
				description="Ask an organization owner or admin to grant you the content manager role."
			/>
		);
	}

	const announcement = await serverTrpcAuthed.announcement.adminGet
		.query({ organizationSlug: orgSlug, announcementId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}
			throw error;
		});

	if (!announcement) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={announcement.title}
				description={announcement.membershipName}
				status={{
					label: announcement.status,
					tone: STATUS_TONES[announcement.status] ?? "muted",
				}}
				actions={
					<>
						{announcement.status === "draft" ? (
							<Button
								variant="outline"
								render={
									<Link
										href={
											`/org/${orgSlug}/announcements/${announcementId}/edit` as Route
										}
									/>
								}
							>
								Edit
							</Button>
						) : null}
						<AnnouncementStatusActions
							orgSlug={orgSlug}
							announcementId={announcementId}
							status={announcement.status}
							pinned={announcement.pinned}
						/>
					</>
				}
			/>

			<FormSection title="Content">
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Visibility
						</dt>
						<dd className="text-sm">
							{VISIBILITY_LABELS[announcement.visibility] ??
								announcement.visibility}
							{announcement.targetTierName
								? ` · ${announcement.targetTierName}`
								: ""}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Likes / Comments
						</dt>
						<dd className="text-sm">
							{announcement.likesCount} / {announcement.commentsCount}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Published
						</dt>
						<dd className="text-sm">
							{announcement.publishedAt
								? new Date(announcement.publishedAt).toLocaleString()
								: "Not published yet"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Last updated
						</dt>
						<dd className="text-sm">
							{new Date(announcement.updatedAt).toLocaleString()}
						</dd>
					</div>
				</dl>
				<p className="text-sm leading-7">{announcement.body}</p>
			</FormSection>

			<FormSection
				title="Comments"
				description="Hide comments that violate your community guidelines."
			>
				<CommentModerationList
					orgSlug={orgSlug}
					announcementId={announcementId}
				/>
			</FormSection>
		</div>
	);
}
