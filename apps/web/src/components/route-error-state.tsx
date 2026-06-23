"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { useEffect } from "react";

function RouteErrorState({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<ErrorState
			title="This page couldn't load"
			description="Something went wrong while fetching this data. Try again, and if the problem continues, refresh the page."
			action={<Button onClick={() => reset()}>Try again</Button>}
		/>
	);
}

export { RouteErrorState };
