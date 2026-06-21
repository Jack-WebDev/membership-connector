import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading membership"
			description="Fetching this membership's details."
		/>
	);
}
