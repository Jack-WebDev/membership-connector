import { AlertTriangleIcon } from "lucide-react";
import type * as React from "react";

import { EmptyState } from "./empty-state";

function ErrorState({
	title = "Something interrupted this view",
	description = "This section is still a placeholder or failed to load. The shell and component wiring are ready for real data.",
	action,
}: {
	title?: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<EmptyState
			icon={<AlertTriangleIcon />}
			title={title}
			description={description}
			action={action}
		/>
	);
}

export { ErrorState };
