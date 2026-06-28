import { db } from "../client";
import { financeTransactions } from "../schema/finance";
import {
	extraFinanceTxDefs,
	type MemberKey,
	type MembershipKey,
	membershipDefs,
	type OrgKey,
	type TierKey,
	tierDefs,
} from "./data";
import type { ActiveMembership } from "./membership";

export async function seedFinanceTransactions(
	orgIds: Record<OrgKey, string>,
	membershipIds: Record<MembershipKey, string>,
	tierIds: Record<TierKey, string>,
	memberIds: Record<MemberKey, string>,
	paidApprovals: ActiveMembership[],
): Promise<void> {
	const membershipDefByKey = new Map(
		membershipDefs.map((def) => [def.key, def]),
	);
	const tierDefByKey = new Map(tierDefs.map((def) => [def.key, def]));

	for (const approval of paidApprovals) {
		const membershipDef = membershipDefByKey.get(approval.membershipKey);
		const tierDef = tierDefByKey.get(approval.tierKey);
		if (!membershipDef || !tierDef) {
			continue;
		}

		await db.insert(financeTransactions).values({
			id: crypto.randomUUID(),
			organizationId: orgIds[membershipDef.orgKey],
			membershipId: membershipIds[approval.membershipKey],
			membershipTierId: tierIds[approval.tierKey],
			userId: memberIds[approval.memberKey],
			type: "membership_payment",
			status: "successful",
			amount: tierDef.price.toFixed(2),
			currency: "ZAR",
			provider: "demo",
			providerReference: `DEMO-PAY-${crypto.randomUUID().slice(0, 8)}`,
			description: `Membership payment for ${tierDef.name} tier`,
		});
	}

	for (const def of extraFinanceTxDefs) {
		const membershipDef = membershipDefByKey.get(def.membershipKey);
		if (!membershipDef) {
			continue;
		}

		await db.insert(financeTransactions).values({
			id: crypto.randomUUID(),
			organizationId: orgIds[membershipDef.orgKey],
			membershipId: membershipIds[def.membershipKey],
			membershipTierId: tierIds[def.tierKey],
			userId: def.memberKey ? memberIds[def.memberKey] : null,
			type: def.type,
			status: def.status,
			amount: def.amount.toFixed(2),
			currency: "ZAR",
			provider: def.provider,
			description: def.description,
		});
	}
}
