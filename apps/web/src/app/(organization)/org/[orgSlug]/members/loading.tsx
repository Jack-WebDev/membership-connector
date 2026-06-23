import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading members"
			description="Fetching your organization's members."
			rows={5}
		/>
	);
}
