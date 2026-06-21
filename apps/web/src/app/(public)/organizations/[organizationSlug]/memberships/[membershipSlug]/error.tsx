"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { AlertTriangleIcon } from "lucide-react";

export default function ErrorPage({
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<EmptyState
			icon={<AlertTriangleIcon />}
			title="We couldn't load this membership"
			description="Something went wrong while fetching data. Please try again."
			action={<Button onClick={reset}>Try again</Button>}
		/>
	);
}
