import type {
	PublicMembershipSummary,
	PublicMembershipTierSummary,
} from "@membership-connector-app/api/membership/types";
import type { PublicOrganizationSummary } from "@membership-connector-app/api/organization/types";
import type {
	MembershipCardProps,
	OrganizationCardProps,
	TierPricingCardProps,
} from "@membership-connector-app/ui/lib/app-types";

const BILLING_INTERVAL_LABELS: Record<
	PublicMembershipTierSummary["billingInterval"],
	string
> = {
	free: "Free",
	once_off: "once-off",
	monthly: "per month",
	quarterly: "per quarter",
	yearly: "per year",
	custom: "custom billing",
};

export function formatBillingInterval(
	interval: PublicMembershipTierSummary["billingInterval"],
): string {
	return BILLING_INTERVAL_LABELS[interval];
}

export function formatPrice(price: string, currency: string): string {
	const amount = Number(price);

	if (amount === 0) {
		return "Free";
	}

	return new Intl.NumberFormat("en-ZA", {
		style: "currency",
		currency,
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
	}).format(amount);
}

export function toMembershipCardProps(
	membership: PublicMembershipSummary,
	options: { href?: string } = {},
): MembershipCardProps {
	return {
		name: membership.name,
		organizationName: membership.organizationName,
		shortDescription: membership.shortDescription ?? "",
		category: membership.category,
		startingPrice: membership.startingTier
			? formatPrice(
					membership.startingTier.price,
					membership.startingTier.currency,
				)
			: "Contact to enquire",
		billingInterval: membership.startingTier
			? formatBillingInterval(membership.startingTier.billingInterval)
			: "",
		activeTiers: membership.activeTierCount,
		href: options.href,
	};
}

export function toOrganizationCardProps(
	organization: PublicOrganizationSummary,
	options: { href?: string } = {},
): OrganizationCardProps {
	return {
		name: organization.name,
		description: organization.description ?? "",
		membershipCount: organization.membershipCount,
		href: options.href,
	};
}

export function toTierPricingCardProps(
	tier: PublicMembershipTierSummary,
): TierPricingCardProps {
	return {
		name: tier.name,
		description: tier.description ?? "",
		price: formatPrice(tier.price, tier.currency),
		billingInterval: formatBillingInterval(tier.billingInterval),
		benefits: tier.benefits.map((benefit) => String(benefit)),
		requirements: tier.requirements.map((requirement) => String(requirement)),
	};
}
