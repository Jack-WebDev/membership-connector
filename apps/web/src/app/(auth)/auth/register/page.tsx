import SignUpForm from "@/components/sign-up-form";
import { redirectAuthenticatedUser } from "@/lib/server-auth";

export default async function AuthRegisterPage() {
	await redirectAuthenticatedUser();

	return <SignUpForm />;
}
