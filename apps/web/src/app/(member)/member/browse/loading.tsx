import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading memberships"
			description="Fetching memberships you can join."
			rows={5}
		/>
	);
}
