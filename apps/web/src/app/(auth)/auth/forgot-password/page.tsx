import ForgotPasswordForm from "@/components/forgot-password-form";
import { redirectAuthenticatedUser } from "@/lib/server-auth";

export default async function ForgotPasswordPage() {
	await redirectAuthenticatedUser();

	return <ForgotPasswordForm />;
}
