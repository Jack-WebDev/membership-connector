"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Label } from "@membership-connector-app/ui/components/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { cn } from "@membership-connector-app/ui/lib/utils";
import type * as React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./select";

export type FilterOption = {
	label: string;
	value: string;
};

export type FilterDefinition = {
	id: string;
	label: string;
	value?: string;
	placeholder?: string;
	options: FilterOption[];
	onValueChange?: (value: string) => void;
};

function FilterBar({
	className,
	filters,
	trailing,
}: {
	className?: string;
	filters: FilterDefinition[];
	trailing?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-[calc(var(--radius)*1.1)] border border-border/80 bg-card/85 p-4 shadow-(--shadow-card) sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
				className,
			)}
		>
			<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
				{filters.map((filter) => (
					<div key={filter.id} className="grid gap-2">
						<Label className="font-semibold text-[0.68rem] text-muted-foreground uppercase tracking-[0.2em]">
							{filter.label}
						</Label>

						<Select
							value={filter.value}
							onValueChange={(value) => filter.onValueChange?.(value as string)}
						>
							<SelectTrigger className="min-w-44 rounded-xl">
								<SelectValue
									placeholder={
										filter.placeholder ?? `All ${filter.label.toLowerCase()}`
									}
								/>
							</SelectTrigger>

							<SelectContent>
								<SelectItem value="">
									{filter.placeholder ?? `All ${filter.label.toLowerCase()}`}
								</SelectItem>

								{filter.options.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				))}
			</div>
			{trailing ? <div className="flex flex-wrap gap-2">{trailing}</div> : null}
		</div>
	);
}

function FilterBarReset({
	children = "Reset filters",
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button variant="outline" {...props}>
			{children}
		</Button>
	);
}

export { FilterBar, FilterBarReset };
