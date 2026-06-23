import { router } from "../index";
import { organizationPermissionProcedure } from "../procedures";
import {
	createFinanceTransaction,
	getFinanceDashboardOverview,
	getFinanceTransactionDetail,
	listAdminFinanceTransactions,
	listFinanceFilterOptions,
	listFinanceMemberOptions,
	listFinanceTierOptions,
} from "./service";
import {
	createFinanceTransactionInput,
	financeMembershipIdInput,
	listAdminFinanceTransactionsInput,
	transactionIdInput,
} from "./types";

export const financeRouter = router({
	adminDashboard: organizationPermissionProcedure("view_finances").query(
		({ ctx }) => getFinanceDashboardOverview(ctx.organization.organizationId),
	),

	adminList: organizationPermissionProcedure("view_finances")
		.input(listAdminFinanceTransactionsInput)
		.query(({ ctx, input }) =>
			listAdminFinanceTransactions(ctx.organization.organizationId, input),
		),

	adminFilterOptions: organizationPermissionProcedure("view_finances").query(
		({ ctx }) => listFinanceFilterOptions(ctx.organization.organizationId),
	),

	adminTierOptions: organizationPermissionProcedure("manage_finance_records")
		.input(financeMembershipIdInput)
		.query(({ ctx, input }) =>
			listFinanceTierOptions(
				ctx.organization.organizationId,
				input.membershipId,
			),
		),

	adminMemberOptions: organizationPermissionProcedure("manage_finance_records")
		.input(financeMembershipIdInput)
		.query(({ ctx, input }) =>
			listFinanceMemberOptions(
				ctx.organization.organizationId,
				input.membershipId,
			),
		),

	adminGet: organizationPermissionProcedure("view_finances")
		.input(transactionIdInput)
		.query(({ ctx, input }) =>
			getFinanceTransactionDetail(
				ctx.organization.organizationId,
				input.transactionId,
			),
		),

	adminCreate: organizationPermissionProcedure("manage_finance_records")
		.input(createFinanceTransactionInput)
		.mutation(({ ctx, input }) =>
			createFinanceTransaction(
				ctx.organization.organizationId,
				ctx.session.user.id,
				input,
			),
		),
});
