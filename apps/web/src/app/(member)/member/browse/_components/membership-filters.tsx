"use client";

import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const BILLING_INTERVAL_OPTIONS = [
	{ label: "Once-off", value: "once_off" },
	{ label: "Monthly", value: "monthly" },
	{ label: "Quarterly", value: "quarterly" },
	{ label: "Yearly", value: "yearly" },
	{ label: "Custom", value: "custom" },
];

const PRICING_OPTIONS = [
	{ label: "Free", value: "free" },
	{ label: "Paid", value: "paid" },
];

function MembershipFilters({ categories }: { categories: string[] }) {
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

	const debouncedUpdateSearch = useDebouncedCallback((value: string) =>
		updateParam("search", value),
	);

	return (
		<FilterBar
			filters={[
				{
					id: "category",
					label: "Category",
					placeholder: "All categories",
					value: searchParams.get("category") ?? "",
					options: categories.map((category) => ({
						label: category,
						value: category,
					})),
					onValueChange: (value) => updateParam("category", value),
				},
				{
					id: "billing",
					label: "Billing",
					placeholder: "Any billing interval",
					value: searchParams.get("billing") ?? "",
					options: BILLING_INTERVAL_OPTIONS,
					onValueChange: (value) => updateParam("billing", value),
				},
				{
					id: "pricing",
					label: "Price",
					placeholder: "Free and paid",
					value: searchParams.get("pricing") ?? "",
					options: PRICING_OPTIONS,
					onValueChange: (value) => updateParam("pricing", value),
				},
			]}
			trailing={
				<>
					<SearchInput
						placeholder="Search memberships"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => debouncedUpdateSearch(event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { MembershipFilters };
