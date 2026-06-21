import { Input } from "@membership-connector-app/ui/components/input";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { SearchIcon } from "lucide-react";
import type * as React from "react";

function SearchInput({
	className,
	...props
}: React.ComponentProps<typeof Input>) {
	return (
		<div className={cn("relative min-w-56", className)}>
			<SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input className="h-10 rounded-full bg-background pr-4 pl-9" {...props} />
		</div>
	);
}

export { SearchInput };
