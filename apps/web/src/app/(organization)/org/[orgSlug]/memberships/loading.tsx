import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading memberships"
			description="Fetching your organization's memberships."
			rows={5}
		/>
	);
}
