import { AnnouncementCard } from "@membership-connector-app/ui/components/announcement-card";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { StatusBadge } from "@membership-connector-app/ui/components/status-badge";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@membership-connector-app/ui/components/tabs";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import {
	formatBillingInterval,
	formatPrice,
} from "@/lib/membership-presenters";
import { requireMemberSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	active: "success",
	pending_payment: "pending",
	expired: "muted",
	cancelled: "muted",
	suspended: "warning",
};

const STATUS_LABELS: Record<string, string> = {
	active: "Active",
	pending_payment: "Awaiting payment",
	expired: "Expired",
	cancelled: "Cancelled",
	suspended: "Suspended",
};

type MemberMembershipDetailPageProps = {
	params: Promise<{ membershipId: string }>;
};

export default async function MemberMembershipDetailPage({
	params,
}: MemberMembershipDetailPageProps) {
	const { membershipId } = await params;

	await requireMemberSession(`/member/memberships/${membershipId}`);

	const membership = await serverTrpcAuthed.membershipMember.getMine
		.query({ membershipId })
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

	const announcements = await serverTrpcAuthed.announcement.listForMembership
		.query({ membershipId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "FORBIDDEN"
			) {
				return [];
			}

			throw error;
		});

	const benefits = membership.tierBenefits.map((benefit) => String(benefit));
	const requirements = membership.tierRequirements.map((requirement) =>
		String(requirement),
	);

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={membership.membershipName}
				description={membership.organizationName}
				status={{
					label: STATUS_LABELS[membership.status] ?? membership.status,
					tone: STATUS_TONES[membership.status] ?? "muted",
				}}
			/>

			<Tabs defaultValue="overview">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="announcements">Announcements</TabsTrigger>
					<TabsTrigger value="billing">Billing</TabsTrigger>
					<TabsTrigger value="contact">Contact</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6 pt-4">
					<FormSection
						title="Membership overview"
						description={membership.tierName}
					>
						<dl className="grid gap-4 sm:grid-cols-2">
							<div className="sm:col-span-2">
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Description
								</dt>
								<dd className="text-sm leading-6">
									{membership.membershipDescription ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Started
								</dt>
								<dd className="text-sm">
									{new Date(membership.startedAt).toLocaleDateString()}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Expiry
								</dt>
								<dd className="text-sm">
									{membership.expiresAt
										? new Date(membership.expiresAt).toLocaleDateString()
										: "No expiry"}
								</dd>
							</div>
						</dl>
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<div className="text-muted-foreground text-xs uppercase tracking-wide">
									Benefits
								</div>
								{benefits.length > 0 ? (
									<ul className="mt-2 space-y-1 text-sm leading-6">
										{benefits.map((benefit) => (
											<li key={benefit}>• {benefit}</li>
										))}
									</ul>
								) : (
									<p className="mt-2 text-muted-foreground text-sm">
										No benefits listed.
									</p>
								)}
							</div>
							<div>
								<div className="text-muted-foreground text-xs uppercase tracking-wide">
									Requirements
								</div>
								{requirements.length > 0 ? (
									<ul className="mt-2 space-y-1 text-sm leading-6">
										{requirements.map((requirement) => (
											<li key={requirement}>• {requirement}</li>
										))}
									</ul>
								) : (
									<p className="mt-2 text-muted-foreground text-sm">
										No requirements listed.
									</p>
								)}
							</div>
						</div>
					</FormSection>
				</TabsContent>

				<TabsContent value="announcements" className="space-y-4 pt-4">
					{announcements.length > 0 ? (
						announcements.map((announcement) => (
							<AnnouncementCard
								key={announcement.id}
								title={announcement.title}
								body={announcement.body}
								authorName={announcement.authorName}
								publishedAt={announcement.publishedAt.toLocaleDateString()}
								visibilityLabel={announcement.visibilityLabel}
								pinned={announcement.pinned}
							/>
						))
					) : (
						<EmptyState
							title="No announcements yet"
							description="When this organization publishes an announcement, it will show up here."
						/>
					)}
				</TabsContent>

				<TabsContent value="billing" className="pt-4">
					<FormSection
						title="Billing"
						description="Demo billing details for this membership."
					>
						<dl className="grid gap-4 sm:grid-cols-2">
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Tier price
								</dt>
								<dd className="text-sm">
									{formatPrice(membership.tierPrice, membership.tierCurrency)}{" "}
									{formatBillingInterval(membership.tierBillingInterval)}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Payment status
								</dt>
								<dd className="text-sm">
									<StatusBadge
										label={
											STATUS_LABELS[membership.status] ?? membership.status
										}
										tone={STATUS_TONES[membership.status] ?? "muted"}
									/>
								</dd>
							</div>
						</dl>
					</FormSection>
				</TabsContent>

				<TabsContent value="contact" className="pt-4">
					<FormSection
						title="Organization contact"
						description={membership.organizationName}
					>
						<dl className="grid gap-4 sm:grid-cols-2">
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Email
								</dt>
								<dd className="text-sm">
									{membership.organizationEmail ?? "—"}
								</dd>
							</div>
							<div>
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Phone
								</dt>
								<dd className="text-sm">
									{membership.organizationPhone ?? "—"}
								</dd>
							</div>
							<div className="sm:col-span-2">
								<dt className="text-muted-foreground text-xs uppercase tracking-wide">
									Website
								</dt>
								<dd className="text-sm">
									{membership.organizationWebsiteUrl ? (
										<a
											href={membership.organizationWebsiteUrl}
											target="_blank"
											rel="noreferrer"
											className="text-primary hover:underline"
										>
											{membership.organizationWebsiteUrl}
										</a>
									) : (
										"—"
									)}
								</dd>
							</div>
						</dl>
					</FormSection>
				</TabsContent>
			</Tabs>
		</div>
	);
}
