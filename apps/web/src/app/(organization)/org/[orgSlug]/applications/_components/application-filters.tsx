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
	{ label: "Submitted", value: "submitted" },
	{ label: "Under review", value: "under_review" },
	{ label: "Needs information", value: "needs_information" },
	{ label: "Approved", value: "approved" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Withdrawn", value: "withdrawn" },
	{ label: "Cancelled", value: "cancelled" },
];

type ApplicationFiltersProps = {
	memberships: { id: string; name: string }[];
	tiers: { id: string; membershipId: string; name: string }[];
};

function ApplicationFilters({ memberships, tiers }: ApplicationFiltersProps) {
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
							Submitted from
						</Label>
						<Input
							type="date"
							className="h-10"
							defaultValue={searchParams.get("submittedFrom") ?? ""}
							onChange={(event) =>
								updateParam("submittedFrom", event.target.value)
							}
						/>
					</div>
					<div className="grid gap-2">
						<Label className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
							Submitted to
						</Label>
						<Input
							type="date"
							className="h-10"
							defaultValue={searchParams.get("submittedTo") ?? ""}
							onChange={(event) =>
								updateParam("submittedTo", event.target.value)
							}
						/>
					</div>
					<SearchInput
						placeholder="Search applicants, membership, tier"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => debouncedUpdateSearch(event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { ApplicationFilters };
