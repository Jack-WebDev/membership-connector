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
	{ label: "Draft", value: "draft" },
	{ label: "Submitted", value: "submitted" },
	{ label: "Under review", value: "under_review" },
	{ label: "Needs information", value: "needs_information" },
	{ label: "Approved", value: "approved" },
	{ label: "Rejected", value: "rejected" },
	{ label: "Withdrawn", value: "withdrawn" },
	{ label: "Cancelled", value: "cancelled" },
];

function ApplicationFilters() {
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
						placeholder="Search applications"
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
