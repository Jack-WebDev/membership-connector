import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading organization"
			description="Fetching this organization's details."
		/>
	);
}
