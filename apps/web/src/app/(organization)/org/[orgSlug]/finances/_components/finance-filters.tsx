"use client";

import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const STATUS_OPTIONS = [
	{ label: "Pending", value: "pending" },
	{ label: "Successful", value: "successful" },
	{ label: "Failed", value: "failed" },
	{ label: "Refunded", value: "refunded" },
	{ label: "Cancelled", value: "cancelled" },
];

const TYPE_OPTIONS = [
	{ label: "Membership payment", value: "membership_payment" },
	{ label: "Refund", value: "refund" },
	{ label: "Adjustment", value: "adjustment" },
	{ label: "Payout", value: "payout" },
	{ label: "Fee", value: "fee" },
];

const PROVIDER_OPTIONS = [
	{ label: "Manual", value: "manual" },
	{ label: "Cash", value: "cash" },
	{ label: "EFT", value: "eft" },
	{ label: "Demo", value: "demo" },
];

type FinanceFiltersProps = {
	memberships: { id: string; name: string }[];
	tiers: { id: string; membershipId: string; name: string }[];
};

function FinanceFilters({ memberships, tiers }: FinanceFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function updateParam(key: string, value: string) {
		const params = new URLSearchParams(searchParams);

		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		params.delete("page");

		router.replace(
			(params.size > 0 ? `${pathname}?${params}` : pathname) as Route,
		);
	}

	const membershipsById = new Map(memberships.map((m) => [m.id, m.name]));

	const debouncedUpdateSearch = useDebouncedCallback((value: string) =>
		updateParam("search", value),
	);

	return (
		<FilterBar
			filters={[
				{
					id: "status",
					label: "Status",
					placeholder: "All statuses",
					value: searchParams.get("status") ?? "",
					options: STATUS_OPTIONS,
					onValueChange: (value) => updateParam("status", value),
				},
				{
					id: "type",
					label: "Type",
					placeholder: "All types",
					value: searchParams.get("type") ?? "",
					options: TYPE_OPTIONS,
					onValueChange: (value) => updateParam("type", value),
				},
				{
					id: "provider",
					label: "Provider",
					placeholder: "All providers",
					value: searchParams.get("provider") ?? "",
					options: PROVIDER_OPTIONS,
					onValueChange: (value) => updateParam("provider", value),
				},
				{
					id: "membershipId",
					label: "Membership",
					placeholder: "All memberships",
					value: searchParams.get("membershipId") ?? "",
					options: memberships.map((membership) => ({
						label: membership.name,
						value: membership.id,
					})),
					onValueChange: (value) => updateParam("membershipId", value),
				},
				{
					id: "membershipTierId",
					label: "Tier",
					placeholder: "All tiers",
					value: searchParams.get("membershipTierId") ?? "",
					options: tiers.map((tier) => ({
						label: `${membershipsById.get(tier.membershipId) ?? "—"} – ${tier.name}`,
						value: tier.id,
					})),
					onValueChange: (value) => updateParam("membershipTierId", value),
				},
			]}
			trailing={
				<>
					<div className="grid gap-2">
						<Label className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
							Date from
						</Label>
						<Input
							type="date"
							className="h-10"
							defaultValue={searchParams.get("dateFrom") ?? ""}
							onChange={(event) => updateParam("dateFrom", event.target.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
							Date to
						</Label>
						<Input
							type="date"
							className="h-10"
							defaultValue={searchParams.get("dateTo") ?? ""}
							onChange={(event) => updateParam("dateTo", event.target.value)}
						/>
					</div>
					<SearchInput
						placeholder="Search transactions"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => debouncedUpdateSearch(event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { FinanceFilters };
