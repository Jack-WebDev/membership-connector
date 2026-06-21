"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type TierRowActionsProps = {
	orgSlug: string;
	tierId: string;
	status: "active" | "inactive" | "archived";
};

function TierRowActions({ orgSlug, tierId, status }: TierRowActionsProps) {
	const router = useRouter();

	const toggleActiveMutation = useMutation(
		trpc.membershipTier.adminToggleActive.mutationOptions({
			onSuccess: () => {
				toast.success(
					status === "active" ? "Tier deactivated" : "Tier activated",
				);
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const archiveMutation = useMutation(
		trpc.membershipTier.adminArchive.mutationOptions({
			onSuccess: () => {
				toast.success("Tier archived");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	if (status === "archived") {
		return <span className="text-muted-foreground text-xs">Archived</span>;
	}

	return (
		<div className="flex justify-end gap-2">
			<Button
				size="sm"
				variant="outline"
				render={
					<Link
						href={`/org/${orgSlug}/membership-tiers/${tierId}/edit` as Route}
					/>
				}
			>
				Edit
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={() =>
					toggleActiveMutation.mutate({ organizationSlug: orgSlug, tierId })
				}
			>
				{status === "active" ? "Deactivate" : "Activate"}
			</Button>
			<ConfirmDialog
				trigger={
					<Button size="sm" variant="destructive">
						Archive
					</Button>
				}
				title="Archive this tier?"
				description="Archived tiers are removed from public listings but kept for historical records. This cannot be undone."
				confirmLabel="Archive"
				onConfirm={() =>
					archiveMutation.mutate({ organizationSlug: orgSlug, tierId })
				}
			/>
		</div>
	);
}

export { TierRowActions };
