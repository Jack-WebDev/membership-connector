"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Label } from "@membership-connector-app/ui/components/label";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { cn } from "@membership-connector-app/ui/lib/utils";

function CommentInput({
	className,
	label = "Add a comment",
	placeholder = "Share a note with members or the organization team.",
	helperText = "Phase 2 placeholder input. Wire to mutations in later phases.",
}: {
	className?: string;
	label?: string;
	placeholder?: string;
	helperText?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-[calc(var(--radius)*1.05)] border border-border/80 bg-card/90 p-4 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			<Label className="font-medium text-foreground text-sm">{label}</Label>
			<Textarea
				className="mt-3 min-h-28 rounded-[calc(var(--radius)*0.9)] bg-background"
				placeholder={placeholder}
			/>
			<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-muted-foreground text-sm">{helperText}</p>
				<Button>Post comment</Button>
			</div>
		</div>
	);
}

export { CommentInput };
