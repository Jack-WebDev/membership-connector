import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading organizations"
			description="Fetching organizations that match your search."
		/>
	);
}
