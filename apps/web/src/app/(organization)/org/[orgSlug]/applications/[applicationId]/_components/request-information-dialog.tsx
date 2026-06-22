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

function RequestInformationDialog({
	orgSlug,
	applicationId,
}: {
	orgSlug: string;
	applicationId: string;
}) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");

	const requestInfoMutation = useMutation(
		trpc.membershipApplication.adminRequestInformation.mutationOptions({
			onSuccess: () => {
				toast.success("Information requested from applicant");
				setOpen(false);
				setMessage("");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" />}>
				Request info
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Request more information</DialogTitle>
					<DialogDescription>
						The applicant will see this message and can resubmit once they've
						responded.
					</DialogDescription>
				</DialogHeader>
				<Textarea
					placeholder="What additional information do you need?"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
				/>
				<DialogFooter>
					<Button
						disabled={
							message.trim().length === 0 || requestInfoMutation.isPending
						}
						onClick={() =>
							requestInfoMutation.mutate({
								organizationSlug: orgSlug,
								applicationId,
								message,
							})
						}
					>
						Send request
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { RequestInformationDialog };
