import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading notifications"
			description="Fetching your latest notifications."
			rows={4}
		/>
	);
}
