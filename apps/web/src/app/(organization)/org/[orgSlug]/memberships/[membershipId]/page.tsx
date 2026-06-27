import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { DataTable } from "@membership-connector-app/ui/components/data-table";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import { PlusIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { TierRowActions } from "../../membership-tiers/_components/tier-row-actions";
import { MembershipStatusActions } from "./_components/membership-status-actions";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	draft: "draft",
	published: "published",
	paused: "paused",
	archived: "archived",
	active: "active",
	inactive: "muted",
};

type MembershipDetailPageProps = {
	params: Promise<{ orgSlug: string; membershipId: string }>;
};

export default async function MembershipDetailPage({
	params,
}: MembershipDetailPageProps) {
	const { orgSlug, membershipId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/memberships/${membershipId}`,
	);

	if (
		!hasOrganizationPermission(organizationAccess.role, "manage_memberships")
	) {
		return (
			<ErrorState
				title="You don't have permission to manage memberships"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const membership = await serverTrpcAuthed.membership.adminGet
		.query({ organizationSlug: orgSlug, membershipId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}
			throw error;
		});

	if (!membership) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={membership.name}
				description={
					membership.shortDescription ?? membership.description ?? undefined
				}
				status={{
					label: membership.status,
					tone: STATUS_TONES[membership.status] ?? "muted",
				}}
				actions={
					<>
						<Button
							variant="outline"
							render={
								<Link
									href={
										`/org/${orgSlug}/memberships/${membershipId}/edit` as Route
									}
								/>
							}
						>
							Edit
						</Button>
						<MembershipStatusActions
							orgSlug={orgSlug}
							membershipId={membershipId}
							status={membership.status}
						/>
					</>
				}
			/>

			<FormSection title="Details" description={`/${membership.slug}`}>
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Category
						</dt>
						<dd className="text-sm">{membership.categoryName}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Visibility
						</dt>
						<dd className="text-sm capitalize">
							{membership.visibility.replace("_", " ")}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Application required
						</dt>
						<dd className="text-sm">
							{membership.applicationRequired ? "Yes" : "No"}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Public announcements
						</dt>
						<dd className="text-sm">
							{membership.publicAnnouncementsEnabled ? "Enabled" : "Disabled"}
						</dd>
					</div>
				</dl>
				{membership.description ? (
					<p className="text-muted-foreground text-sm leading-6">
						{membership.description}
					</p>
				) : null}
			</FormSection>

			<DataTable
				title="Tiers"
				description={`${membership.tiers.length} tier${membership.tiers.length === 1 ? "" : "s"}`}
				toolbar={
					<Button
						size="sm"
						render={
							<Link
								href={
									`/org/${orgSlug}/membership-tiers/new?membershipId=${membershipId}` as Route
								}
							/>
						}
					>
						<PlusIcon />
						Add tier
					</Button>
				}
				columns={[
					{
						id: "name",
						header: "Tier",
						cell: (tier) => tier.name,
					},
					{
						id: "price",
						header: "Price",
						cell: (tier) =>
							tier.billingInterval === "free"
								? "Free"
								: `${tier.currency} ${tier.price} / ${tier.billingInterval.replace("_", " ")}`,
					},
					{
						id: "status",
						header: "Status",
						cell: (tier) => (
							<StatusBadge
								label={tier.status}
								tone={STATUS_TONES[tier.status] ?? "muted"}
							/>
						),
					},
					{
						id: "maxMembers",
						header: "Max members",
						cell: (tier) => tier.maxMembers ?? "Unlimited",
					},
				]}
				rows={membership.tiers}
				rowKey={(tier) => tier.id}
				actions={(tier) => (
					<TierRowActions
						orgSlug={orgSlug}
						tierId={tier.id}
						status={tier.status}
					/>
				)}
				emptyTitle="No tiers yet"
				emptyDescription="Add a tier to let members choose how they want to join."
			/>
		</div>
	);
}
