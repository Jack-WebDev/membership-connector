"use client";

import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

const STATUS_OPTIONS = [
	{ label: "Active", value: "active" },
	{ label: "Inactive", value: "inactive" },
	{ label: "Archived", value: "archived" },
];

function TierFilters({
	membershipOptions,
}: {
	membershipOptions: { id: string; name: string }[];
}) {
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
					id: "membershipId",
					label: "Membership",
					placeholder: "All memberships",
					value: searchParams.get("membershipId") ?? "",
					options: membershipOptions.map((option) => ({
						label: option.name,
						value: option.id,
					})),
					onValueChange: (value) => updateParam("membershipId", value),
				},
				{
					id: "status",
					label: "Status",
					placeholder: "All statuses",
					value: searchParams.get("status") ?? "",
					options: STATUS_OPTIONS,
					onValueChange: (value) => updateParam("status", value),
				},
			]}
			trailing={
				<>
					<SearchInput
						placeholder="Search tiers"
						defaultValue={searchParams.get("search") ?? ""}
						onChange={(event) => debouncedUpdateSearch(event.target.value)}
					/>
					<FilterBarReset onClick={() => router.replace(pathname as Route)} />
				</>
			}
		/>
	);
}

export { TierFilters };
