import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { TRPCClientError } from "@trpc/client";
import { notFound } from "next/navigation";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { TierForm } from "../../_components/tier-form";

type EditTierPageProps = {
	params: Promise<{ orgSlug: string; tierId: string }>;
};

export default async function EditTierPage({ params }: EditTierPageProps) {
	const { orgSlug, tierId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/membership-tiers/${tierId}/edit`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "manage_tiers")) {
		return (
			<ErrorState
				title="You don't have permission to manage membership tiers"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const tier = await serverTrpcAuthed.membershipTier.adminGet
		.query({ organizationSlug: orgSlug, tierId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}
			throw error;
		});

	if (!tier) {
		notFound();
	}

	if (tier.status === "archived") {
		return (
			<ErrorState
				title="Archived tiers cannot be edited"
				description="This tier was archived and is kept for historical records only."
			/>
		);
	}

	return (
		<FormSection
			title={`Edit ${tier.name}`}
			description={`Part of ${tier.membershipName}. Free tiers must be priced at 0.`}
		>
			<TierForm
				orgSlug={orgSlug}
				mode="edit"
				tierId={tier.id}
				membershipOptions={[
					{ id: tier.membershipId, name: tier.membershipName },
				]}
				lockMembership
				defaultValues={{
					membershipId: tier.membershipId,
					name: tier.name,
					description: tier.description ?? "",
					price: tier.price,
					currency: tier.currency,
					billingInterval: tier.billingInterval,
					benefitsText: (tier.benefits as string[]).join("\n"),
					requirementsText: (tier.requirements as string[]).join("\n"),
					maxMembers: tier.maxMembers ? String(tier.maxMembers) : "",
					status: tier.status === "active" ? "active" : "inactive",
				}}
			/>
		</FormSection>
	);
}
