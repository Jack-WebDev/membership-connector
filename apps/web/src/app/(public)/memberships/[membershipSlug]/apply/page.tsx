import type { Route } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { serverTrpc } from "@/utils/trpc-server";

type VanityApplyPageProps = {
	params: Promise<{ membershipSlug: string }>;
};

export default async function VanityApplyPage({
	params,
}: VanityApplyPageProps) {
	const { membershipSlug } = await params;

	const match = await serverTrpc.membership.findPublicBySlug.query({
		membershipSlug,
	});

	if (!match) {
		notFound();
	}

	permanentRedirect(
		`/organizations/${match.organizationSlug}/memberships/${match.membershipSlug}/apply` as Route,
	);
}
