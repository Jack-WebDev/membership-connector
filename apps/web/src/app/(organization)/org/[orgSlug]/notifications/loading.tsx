import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading notifications"
			description="Fetching the latest organization notifications."
			rows={4}
		/>
	);
}
