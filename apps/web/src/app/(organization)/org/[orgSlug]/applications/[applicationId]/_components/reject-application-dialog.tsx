"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@membership-connector-app/ui/components/dialog";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function RejectApplicationDialog({
	orgSlug,
	applicationId,
}: {
	orgSlug: string;
	applicationId: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [reviewNotes, setReviewNotes] = useState("");

	const rejectMutation = useMutation(
		trpc.membershipApplication.adminReject.mutationOptions({
			onSuccess: () => {
				toast.success("Application rejected");
				setOpen(false);
				setReviewNotes("");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="destructive" />}>
				Reject
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Reject this application?</DialogTitle>
					<DialogDescription>
						Provide a reason. The applicant will see this note on their
						application.
					</DialogDescription>
				</DialogHeader>
				<Textarea
					placeholder="Reason for rejecting this application"
					value={reviewNotes}
					onChange={(event) => setReviewNotes(event.target.value)}
				/>
				<DialogFooter>
					<Button
						variant="destructive"
						disabled={
							reviewNotes.trim().length === 0 || rejectMutation.isPending
						}
						onClick={() =>
							rejectMutation.mutate({
								organizationSlug: orgSlug,
								applicationId,
								reviewNotes,
							})
						}
					>
						Reject application
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { RejectApplicationDialog };
