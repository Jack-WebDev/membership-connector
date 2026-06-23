"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Label } from "@membership-connector-app/ui/components/label";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { useState } from "react";

function CommentInput({
	className,
	label = "Add a comment",
	placeholder = "Share a note with members or the organization team.",
	helperText,
	submitLabel = "Post comment",
	value,
	onChange,
	onSubmit,
	isSubmitting = false,
}: {
	className?: string;
	label?: string;
	placeholder?: string;
	helperText?: string;
	submitLabel?: string;
	value?: string;
	onChange?: (value: string) => void;
	onSubmit?: (value: string) => void;
	isSubmitting?: boolean;
}) {
	const [internalValue, setInternalValue] = useState("");
	const isControlled = value !== undefined;
	const currentValue = isControlled ? value : internalValue;

	function handleChange(next: string) {
		if (!isControlled) {
			setInternalValue(next);
		}
		onChange?.(next);
	}

	function handleSubmit() {
		if (currentValue.trim().length === 0) {
			return;
		}
		onSubmit?.(currentValue);
		if (!isControlled) {
			setInternalValue("");
		}
	}

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
				value={currentValue}
				onChange={(e) => handleChange(e.target.value)}
			/>
			<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{helperText ? (
					<p className="text-muted-foreground text-sm">{helperText}</p>
				) : (
					<span />
				)}
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting || currentValue.trim().length === 0}
				>
					{isSubmitting ? "Posting..." : submitLabel}
				</Button>
			</div>
		</div>
	);
}

export { CommentInput };
