import { AlertTriangleIcon } from "lucide-react";

import { EmptyState } from "./empty-state";

function ErrorState({
	title = "Something interrupted this view",
	description = "This section is still a placeholder or failed to load. The shell and component wiring are ready for real data.",
}: {
	title?: string;
	description?: string;
}) {
	return (
		<EmptyState
			icon={<AlertTriangleIcon />}
			title={title}
			description={description}
		/>
	);
}

export { ErrorState };
