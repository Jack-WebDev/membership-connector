import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading announcements"
			description="Fetching announcements for your memberships."
			rows={5}
		/>
	);
}
