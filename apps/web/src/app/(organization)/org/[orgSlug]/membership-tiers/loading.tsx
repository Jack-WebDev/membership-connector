import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading membership tiers"
			description="Fetching pricing tiers across your memberships."
			rows={5}
		/>
	);
}
