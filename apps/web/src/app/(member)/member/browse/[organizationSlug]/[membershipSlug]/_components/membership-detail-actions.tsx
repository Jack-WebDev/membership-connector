"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookmarkIcon } from "lucide-react";

import { trpc } from "@/utils/trpc";

type MembershipDetailActionsProps = {
	membershipId: string;
};

function MembershipDetailActions({
	membershipId,
}: MembershipDetailActionsProps) {
	const isSavedQuery = useQuery(
		trpc.membership.isSaved.queryOptions({ membershipId }),
	);

	const toggleSavedMutation = useMutation(
		trpc.membership.toggleSaved.mutationOptions({
			onSuccess: () => {
				isSavedQuery.refetch();
			},
		}),
	);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button
				size="lg"
				variant="outline"
				disabled={toggleSavedMutation.isPending}
				onClick={() => toggleSavedMutation.mutate({ membershipId })}
			>
				<BookmarkIcon
					className={isSavedQuery.data ? "fill-current" : undefined}
				/>
				{isSavedQuery.data ? "Saved" : "Save"}
			</Button>
		</div>
	);
}

export { MembershipDetailActions };
