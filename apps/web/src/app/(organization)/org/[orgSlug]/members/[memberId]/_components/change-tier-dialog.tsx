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
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type ChangeTierDialogProps = {
	orgSlug: string;
	memberId: string;
	currentTierId: string;
	tiers: { id: string; name: string }[];
};

function ChangeTierDialog({
	orgSlug,
	memberId,
	currentTierId,
	tiers,
}: ChangeTierDialogProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [membershipTierId, setMembershipTierId] = useState(currentTierId);

	const changeTierMutation = useMutation(
		trpc.membershipMember.adminChangeTier.mutationOptions({
			onSuccess: () => {
				toast.success("Member tier updated");
				setOpen(false);
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button variant="outline" />}>
				Change tier
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change this member's tier</DialogTitle>
					<DialogDescription>
						Only active tiers for this membership can be selected.
					</DialogDescription>
				</DialogHeader>
				<NativeSelect
					value={membershipTierId}
					onChange={(event) => setMembershipTierId(event.target.value)}
				>
					{tiers.map((tier) => (
						<NativeSelectOption key={tier.id} value={tier.id}>
							{tier.name}
						</NativeSelectOption>
					))}
				</NativeSelect>
				<DialogFooter>
					<Button
						disabled={
							membershipTierId === currentTierId || changeTierMutation.isPending
						}
						onClick={() =>
							changeTierMutation.mutate({
								organizationSlug: orgSlug,
								memberId,
								membershipTierId,
							})
						}
					>
						Save tier
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export { ChangeTierDialog };
