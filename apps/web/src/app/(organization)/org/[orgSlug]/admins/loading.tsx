import { LoadingState } from "@membership-connector-app/ui/components/loading-state";

export default function Loading() {
	return (
		<LoadingState
			title="Loading admins"
			description="Fetching organization admins and their roles."
			rows={4}
		/>
	);
}
