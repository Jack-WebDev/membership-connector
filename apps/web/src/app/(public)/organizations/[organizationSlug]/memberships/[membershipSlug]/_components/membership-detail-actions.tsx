"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookmarkIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { trpc } from "@/utils/trpc";

type MembershipDetailActionsProps = {
	membershipId: string;
	applyHref: string;
	auth: "anonymous" | "member" | "no-member-role";
};

function MembershipDetailActions({
	membershipId,
	applyHref,
	auth,
}: MembershipDetailActionsProps) {
	const isSavedQuery = useQuery({
		...trpc.membership.isSaved.queryOptions({ membershipId }),
		enabled: auth === "member",
	});

	const toggleSavedMutation = useMutation(
		trpc.membership.toggleSaved.mutationOptions({
			onSuccess: () => {
				isSavedQuery.refetch();
			},
		}),
	);

	const applyLink =
		auth === "anonymous"
			? (`/auth/login?redirectTo=${encodeURIComponent(applyHref)}` as Route)
			: auth === "no-member-role"
				? ("/onboarding/member" as Route)
				: (applyHref as Route);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button size="lg" render={<Link href={applyLink} />}>
				Apply now
			</Button>
			{auth === "member" ? (
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
			) : null}
		</div>
	);
}

export { MembershipDetailActions };
