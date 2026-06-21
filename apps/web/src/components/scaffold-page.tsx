import { Button } from "@membership-connector-app/ui/components/button";
import { DashboardHeader } from "@membership-connector-app/ui/components/dashboard-header";
import {
	DataTable,
	type DataTableColumn,
} from "@membership-connector-app/ui/components/data-table";
import { EmptyState } from "@membership-connector-app/ui/components/empty-state";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import {
	FilterBar,
	FilterBarReset,
} from "@membership-connector-app/ui/components/filter-bar";
import { LoadingState } from "@membership-connector-app/ui/components/loading-state";
import { SearchInput } from "@membership-connector-app/ui/components/search-input";
import { StatCard } from "@membership-connector-app/ui/components/stat-card";
import type { StatusBadgeTone } from "@membership-connector-app/ui/lib/app-types";
import { ActivityIcon, FolderClockIcon, LayoutGridIcon } from "lucide-react";

type TableRow = {
	name: string;
	status: string;
	owner: string;
	updatedAt: string;
};

const rows: TableRow[] = [
	{
		name: "Phase 2 placeholder",
		status: "Scaffolded",
		owner: "Shared UI",
		updatedAt: "Today",
	},
	{
		name: "Layout shell",
		status: "Ready",
		owner: "apps/web",
		updatedAt: "Today",
	},
	{
		name: "Future domain wiring",
		status: "Pending",
		owner: "Later phases",
		updatedAt: "Next phase",
	},
];

const columns: DataTableColumn<TableRow>[] = [
	{ id: "name", header: "Name", cell: (row) => row.name },
	{ id: "status", header: "Status", cell: (row) => row.status },
	{ id: "owner", header: "Owner", cell: (row) => row.owner },
	{ id: "updatedAt", header: "Updated", cell: (row) => row.updatedAt },
];

export default function ScaffoldPage({
	title,
	description,
	statusLabel = "Scaffold ready",
	statusTone = "info",
}: {
	title: string;
	description: string;
	statusLabel?: string;
	statusTone?: StatusBadgeTone;
}) {
	return (
		<div className="space-y-6">
			<DashboardHeader
				title={title}
				description={description}
				status={{ label: statusLabel, tone: statusTone }}
				actions={
					<>
						<Button variant="outline">Primary action placeholder</Button>
						<Button>Connected later</Button>
					</>
				}
			/>
			<div className="grid gap-4 md:grid-cols-3">
				<StatCard
					label="Visual system"
					value="Ready"
					description="Tokens and shared blocks are live."
					icon={<LayoutGridIcon />}
				/>
				<StatCard
					label="Integration state"
					value="Shell"
					description="Routing and placeholder content are connected."
					indicator={{ label: "Phase 2", tone: "warning" }}
					icon={<FolderClockIcon />}
				/>
				<StatCard
					label="Next milestone"
					value="Data"
					description="Phase 3 can plug real schema and services into this shell."
					icon={<ActivityIcon />}
				/>
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<div className="space-y-6">
					<FilterBar
						filters={[
							{
								id: "status",
								label: "Status",
								placeholder: "All statuses",
								options: [
									{ label: "Draft", value: "draft" },
									{ label: "Published", value: "published" },
								],
							},
							{
								id: "scope",
								label: "Scope",
								placeholder: "All scopes",
								options: [
									{ label: "Public", value: "public" },
									{ label: "Private", value: "private" },
								],
							},
						]}
						trailing={
							<>
								<SearchInput placeholder="Search placeholder content" />
								<FilterBarReset />
							</>
						}
					/>
					<DataTable
						title="Scaffold inventory"
						description="A reusable table surface with search/filter toolbar support and placeholder row actions."
						columns={columns}
						rows={rows}
						rowKey={(row) => row.name}
						actions={() => <Button variant="ghost">Open</Button>}
					/>
				</div>
				<div className="space-y-6">
					<LoadingState rows={4} />
					<EmptyState
						title="No live data yet"
						description="This route exists to prove the shell, typography, spacing, states, and navigation before backend features land."
					/>
					<ErrorState description="Error styling is part of the shared foundation and can be reused by later data-driven screens." />
				</div>
			</div>
		</div>
	);
}
