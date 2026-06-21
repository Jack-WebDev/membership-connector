import { redirect } from "next/navigation";
import {
	getAuthenticatedRedirectPath,
	requireSession,
} from "@/lib/server-auth";

export default async function LegacyDashboardPage() {
	const session = await requireSession("/dashboard");

	return redirect(await getAuthenticatedRedirectPath(session.user.id));
}
