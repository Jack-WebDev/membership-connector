import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@membership-connector-app/ui/components/table";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { DatabaseIcon } from "lucide-react";
import type * as React from "react";

export type DataTableColumn<TData> = {
	id: string;
	header: React.ReactNode;
	cell: (row: TData) => React.ReactNode;
	className?: string;
};

function DataTable<TData>({
	className,
	title,
	description,
	columns,
	rows,
	rowKey,
	toolbar,
	actions,
	loading,
	error,
	emptyTitle = "No records yet",
	emptyDescription = "This table is ready for real data and filters.",
	pagination,
}: {
	className?: string;
	title?: React.ReactNode;
	description?: React.ReactNode;
	columns: DataTableColumn<TData>[];
	rows: TData[];
	rowKey: (row: TData, index: number) => string;
	toolbar?: React.ReactNode;
	actions?: (row: TData) => React.ReactNode;
	loading?: React.ReactNode;
	error?: React.ReactNode;
	emptyTitle?: React.ReactNode;
	emptyDescription?: React.ReactNode;
	pagination?: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-[calc(var(--radius)*1.15)] border border-border/80 bg-card/90 shadow-[var(--shadow-card)]",
				className,
			)}
		>
			{title || description || toolbar ? (
				<div className="flex flex-col gap-4 border-border/80 border-b p-5 sm:flex-row sm:items-end sm:justify-between">
					<div className="space-y-1">
						{title ? (
							<h3 className="font-medium text-base text-foreground">{title}</h3>
						) : null}
						{description ? (
							<p className="text-muted-foreground text-sm">{description}</p>
						) : null}
					</div>
					{toolbar ? (
						<div className="flex flex-wrap gap-3">{toolbar}</div>
					) : null}
				</div>
			) : null}
			{loading ? (
				<div className="p-5">{loading}</div>
			) : error ? (
				<div className="p-5">{error}</div>
			) : rows.length === 0 ? (
				<div className="p-5">
					<EmptyState
						icon={<DatabaseIcon />}
						title={emptyTitle}
						description={emptyDescription}
					/>
				</div>
			) : (
				<>
					<Table>
						<TableHeader className="bg-muted/45">
							<TableRow className="border-border/80 hover:bg-transparent">
								{columns.map((column) => (
									<TableHead key={column.id} className={column.className}>
										{column.header}
									</TableHead>
								))}
								{actions ? (
									<TableHead className="text-right">Actions</TableHead>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow key={rowKey(row, index)} className="border-border/70">
									{columns.map((column) => (
										<TableCell key={column.id} className={column.className}>
											{column.cell(row)}
										</TableCell>
									))}
									{actions ? (
										<TableCell className="text-right">{actions(row)}</TableCell>
									) : null}
								</TableRow>
							))}
						</TableBody>
					</Table>
					{pagination ? (
						<div className="border-border/80 border-t p-4">{pagination}</div>
					) : null}
				</>
			)}
		</div>
	);
}

export { DataTable };
