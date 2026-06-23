"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ConfirmDialog } from "@membership-connector-app/ui/components/confirm-dialog";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type AnnouncementStatus = "draft" | "published" | "archived";

type AnnouncementStatusActionsProps = {
	orgSlug: string;
	announcementId: string;
	status: AnnouncementStatus;
	pinned: boolean;
};

function AnnouncementStatusActions({
	orgSlug,
	announcementId,
	status,
	pinned,
}: AnnouncementStatusActionsProps) {
	const router = useRouter();

	const publishMutation = useMutation(
		trpc.announcement.adminPublish.mutationOptions({
			onSuccess: () => {
				toast.success("Announcement published");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);
	const archiveMutation = useMutation(
		trpc.announcement.adminArchive.mutationOptions({
			onSuccess: () => {
				toast.success("Announcement archived");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);
	const pinMutation = useMutation(
		trpc.announcement.adminTogglePin.mutationOptions({
			onSuccess: () => {
				toast.success(pinned ? "Announcement unpinned" : "Announcement pinned");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const input = { organizationSlug: orgSlug, announcementId };

	return (
		<div className="flex flex-wrap gap-3">
			{status === "draft" ? (
				<Button onClick={() => publishMutation.mutate(input)}>Publish</Button>
			) : null}
			{status !== "archived" ? (
				<Button
					variant="outline"
					onClick={() => pinMutation.mutate({ ...input, pinned: !pinned })}
				>
					{pinned ? "Unpin" : "Pin"}
				</Button>
			) : null}
			{status === "published" ? (
				<ConfirmDialog
					trigger={<Button variant="destructive">Archive</Button>}
					title="Archive this announcement?"
					description="Archived announcements are no longer visible to members. This cannot be undone from here."
					confirmLabel="Archive"
					onConfirm={() => archiveMutation.mutate(input)}
				/>
			) : null}
		</div>
	);
}

export { AnnouncementStatusActions };
