"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

function MemberNotesForm({
	orgSlug,
	memberId,
	initialNotes,
}: {
	orgSlug: string;
	memberId: string;
	initialNotes: string | null;
}) {
	const router = useRouter();
	const [notes, setNotes] = useState(initialNotes ?? "");

	const updateNotesMutation = useMutation(
		trpc.membershipMember.adminUpdateNotes.mutationOptions({
			onSuccess: () => {
				toast.success("Notes saved");
				router.refresh();
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<div className="space-y-3">
			<Textarea
				placeholder="Internal notes about this member (not visible to the member)"
				value={notes}
				onChange={(event) => setNotes(event.target.value)}
			/>
			<Button
				variant="outline"
				disabled={updateNotesMutation.isPending}
				onClick={() =>
					updateNotesMutation.mutate({
						organizationSlug: orgSlug,
						memberId,
						notes,
					})
				}
			>
				Save notes
			</Button>
		</div>
	);
}

export { MemberNotesForm };
