import SignInForm from "@/components/sign-in-form";
import { redirectAuthenticatedUser } from "@/lib/server-auth";

export default async function AuthLoginPage() {
	await redirectAuthenticatedUser();

	return <SignInForm />;
}
