import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";

import { requireOrganizationSession } from "@/lib/server-auth";
import { serverTrpcAuthed } from "@/utils/trpc-server";

import { FinanceTransactionForm } from "../_components/finance-transaction-form";

type NewFinanceTransactionPageProps = {
	params: Promise<{ orgSlug: string }>;
};

export default async function NewFinanceTransactionPage({
	params,
}: NewFinanceTransactionPageProps) {
	const { orgSlug } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/finances/new`,
	);

	if (
		!hasOrganizationPermission(
			organizationAccess.role,
			"manage_finance_records",
		)
	) {
		return (
			<ErrorState
				title="You don't have permission to record finance transactions"
				description="Ask an organization owner or admin to grant you the finance manager role."
			/>
		);
	}

	const filterOptions = await serverTrpcAuthed.finance.adminFilterOptions.query(
		{ organizationSlug: orgSlug },
	);

	return (
		<FormSection
			title="Record finance transaction"
			description="This is a demo finance record. No payment will actually be processed."
		>
			<FinanceTransactionForm
				orgSlug={orgSlug}
				memberships={filterOptions.memberships}
			/>
		</FormSection>
	);
}
