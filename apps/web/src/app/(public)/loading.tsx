import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading"
			description="Fetching the latest groups and memberships."
		/>
	);
}
