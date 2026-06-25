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
			<Input
				className="h-11 rounded-full border-white/70 bg-white/82 pr-4 pl-9 shadow-[0_12px_28px_rgb(33_56_74_/_0.08)]"
				{...props}
			/>
		</div>
	);
}

export { SearchInput };
