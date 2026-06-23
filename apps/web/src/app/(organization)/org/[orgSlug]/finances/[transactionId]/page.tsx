import { hasOrganizationPermission } from "@membership-connector-app/api/permissions/permissions";
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

const STATUS_TONES: Record<string, StatusBadgeTone> = {
	pending: "pending",
	successful: "success",
	failed: "danger",
	refunded: "muted",
	cancelled: "muted",
};

type FinanceTransactionDetailPageProps = {
	params: Promise<{ orgSlug: string; transactionId: string }>;
};

export default async function FinanceTransactionDetailPage({
	params,
}: FinanceTransactionDetailPageProps) {
	const { orgSlug, transactionId } = await params;
	const { organizationAccess } = await requireOrganizationSession(
		orgSlug,
		`/org/${orgSlug}/finances/${transactionId}`,
	);

	if (!hasOrganizationPermission(organizationAccess.role, "view_finances")) {
		return (
			<ErrorState
				title="You don't have permission to view this transaction"
				description="Ask an organization owner or admin to grant you the finance manager role."
			/>
		);
	}

	const transaction = await serverTrpcAuthed.finance.adminGet
		.query({ organizationSlug: orgSlug, transactionId })
		.catch((error) => {
			if (
				error instanceof TRPCClientError &&
				error.data?.code === "NOT_FOUND"
			) {
				return null;
			}

			throw error;
		});

	if (!transaction) {
		notFound();
	}

	return (
		<div className="space-y-6">
			<DashboardHeader
				title={`${transaction.currency} ${transaction.amount}`}
				description={transaction.type.replace("_", " ")}
				status={{
					label: transaction.status,
					tone: STATUS_TONES[transaction.status] ?? "muted",
				}}
			/>

			<FormSection title="Transaction details">
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Amount
						</dt>
						<dd className="text-sm">
							{transaction.currency} {transaction.amount}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Type
						</dt>
						<dd className="text-sm capitalize">
							{transaction.type.replace("_", " ")}
						</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Provider
						</dt>
						<dd className="text-sm capitalize">{transaction.provider}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Provider reference
						</dt>
						<dd className="text-sm">{transaction.providerReference ?? "—"}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Recorded
						</dt>
						<dd className="text-sm">
							{new Date(transaction.createdAt).toLocaleString()}
						</dd>
					</div>
					<div className="sm:col-span-2">
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Description
						</dt>
						<dd className="text-sm">{transaction.description ?? "—"}</dd>
					</div>
				</dl>
			</FormSection>

			<FormSection title="Related records">
				<dl className="grid gap-4 sm:grid-cols-2">
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Membership
						</dt>
						<dd className="text-sm">{transaction.membershipName ?? "—"}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Tier
						</dt>
						<dd className="text-sm">{transaction.tierName ?? "—"}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Member
						</dt>
						<dd className="text-sm">
							{transaction.userName ? (
								<>
									{transaction.userName}
									<span className="text-muted-foreground">
										{" "}
										({transaction.userEmail})
									</span>
								</>
							) : (
								"—"
							)}
						</dd>
					</div>
				</dl>
				<Link
					href={`/org/${orgSlug}/finances` as Route}
					className="mt-4 inline-block text-primary text-sm underline-offset-4 hover:underline"
				>
					Back to finances
				</Link>
			</FormSection>
		</div>
	);
}
