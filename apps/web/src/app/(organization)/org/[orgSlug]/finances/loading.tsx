import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading finances"
			description="Fetching demo finance records and revenue summaries."
			rows={5}
		/>
	);
}
