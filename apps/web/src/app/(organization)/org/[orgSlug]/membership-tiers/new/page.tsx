import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { TierForm } from "../_components/tier-form";

type NewTierPageProps = {
	params: Promise<{ orgSlug: string }>;
	searchParams: Promise<{ membershipId?: string }>;
};

export default async function NewTierPage({
	params,
	searchParams,
}: NewTierPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/membership-tiers/new`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "manage_tiers")) {
		return (
			<ErrorState
				title="You don't have permission to manage membership tiers"
				description="Ask an organization owner or admin to grant you the membership manager role."
			/>
		);
	}

	const { membershipId } = await searchParams;

	const membershipOptions =
		await serverTrpcAuthed.membershipTier.adminMembershipOptions.query({
			organizationSlug: orgSlug,
		});

	if (membershipOptions.length === 0) {
		return (
			<ErrorState
				title="Create a membership first"
				description="You need at least one membership before you can add tiers to it."
			/>
		);
	}

	return (
		<FormSection
			title="New tier"
			description="Free tiers must be priced at 0. Archiving a tier later is one-way and keeps its history."
		>
			<TierForm
				orgSlug={orgSlug}
				mode="create"
				membershipOptions={membershipOptions}
				lockMembership={Boolean(membershipId)}
				defaultValues={{
					membershipId: membershipId ?? membershipOptions[0].id,
					name: "",
					description: "",
					price: "0",
					currency: "ZAR",
					billingInterval: "free",
					benefitsText: "",
					requirementsText: "",
					maxMembers: "",
					status: "active",
				}}
			/>
		</FormSection>
	);
}
