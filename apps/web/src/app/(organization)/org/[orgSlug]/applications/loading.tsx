import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading applications"
			description="Fetching submitted applications for review."
			rows={5}
		/>
	);
}
