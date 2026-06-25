"use client";

import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

function OrganizationSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	function updateSearch(value: string) {
		const params = new URLSearchParams(searchParams);

		if (value) {
			params.set("search", value);
		} else {
			params.delete("search");
		}
		params.delete("page");

		router.replace(
			(params.size > 0 ? `${pathname}?${params}` : pathname) as Route,
		);
	}

	const debouncedUpdateSearch = useDebouncedCallback(updateSearch);

	return (
		<SearchInput
			placeholder="Search organizations"
			defaultValue={searchParams.get("search") ?? ""}
			onChange={(event) => debouncedUpdateSearch(event.target.value)}
		/>
	);
}

export { OrganizationSearch };
