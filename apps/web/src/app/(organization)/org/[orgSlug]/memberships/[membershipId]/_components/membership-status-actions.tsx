"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type MembershipStatus = "draft" | "published" | "paused" | "archived";

type MembershipStatusActionsProps = {
	orgSlug: string;
	membershipId: string;
	status: MembershipStatus;
};

function MembershipStatusActions({
	orgSlug,
	membershipId,
	status,
}: MembershipStatusActionsProps) {
	const router = useRouter();

	const publishMutation = useMutation(
		trpc.membership.adminPublish.mutationOptions({
			onSuccess: () => {
				toast.success("Membership published");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);
	const pauseMutation = useMutation(
		trpc.membership.adminPause.mutationOptions({
			onSuccess: () => {
				toast.success("Membership paused");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);
	const archiveMutation = useMutation(
		trpc.membership.adminArchive.mutationOptions({
			onSuccess: () => {
				toast.success("Membership archived");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const input = { organizationSlug: orgSlug, membershipId };

	if (status === "archived") {
		return null;
	}

	return (
		<div className="flex flex-wrap gap-3">
			{status === "draft" ? (
				<Button onClick={() => publishMutation.mutate(input)}>Publish</Button>
			) : null}
			{status === "published" ? (
				<Button variant="outline" onClick={() => pauseMutation.mutate(input)}>
					Pause
				</Button>
			) : null}
			{status === "paused" ? (
				<Button onClick={() => publishMutation.mutate(input)}>Resume</Button>
			) : null}
			<ConfirmDialog
				trigger={<Button variant="destructive">Archive</Button>}
				title="Archive this membership?"
				description="Archived memberships are removed from public listings but kept for historical records. This cannot be undone from here."
				confirmLabel="Archive"
				onConfirm={() => archiveMutation.mutate(input)}
			/>
		</div>
	);
}

export { MembershipStatusActions };
