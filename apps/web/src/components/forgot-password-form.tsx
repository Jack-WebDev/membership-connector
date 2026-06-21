"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Mail } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordForm() {
	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset(
				{
					email: value.email,
					redirectTo: `${window.location.origin}/auth/reset-password`,
				},
				{
					onSuccess: () => {
						toast.success(
							"If that email exists, the reset link has been sent.",
						);
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
			}),
		},
	});

	return (
		<FormSection
			title="Reset your password"
			description="Enter your email and we'll send a reset link."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="email">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Email</Label>
							<div className="relative">
								<Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder="you@example.com"
									autoComplete="email"
									className="pl-9"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-sm">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							size="lg"
							className="w-full"
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Sending reset link..." : "Send reset link"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="pt-2 text-center text-muted-foreground text-sm">
				Remembered it?{" "}
				<Link
					href={"/auth/login" as Route}
					className="font-medium text-primary hover:underline"
				>
					Back to sign in
				</Link>
			</div>
		</FormSection>
	);
}
