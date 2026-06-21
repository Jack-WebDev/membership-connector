"use client";

import { Button } from "@membership-connector-app/ui/components/button";
import { ErrorState } from "@membership-connector-app/ui/components/error-state";
import { FormSection } from "@membership-connector-app/ui/components/form-section";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z
	.object({
		password: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z.string().min(8, "Confirm your new password"),
	})
	.refine((value) => value.password === value.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export default function ResetPasswordForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const tokenError = searchParams.get("error");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm({
		defaultValues: {
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			if (!token) {
				toast.error("The reset link is missing or invalid.");
				return;
			}

			await authClient.resetPassword(
				{
					token,
					newPassword: value.password,
				},
				{
					onSuccess: () => {
						toast.success("Password updated. You can sign in now.");
						router.push("/auth/login");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: resetPasswordSchema,
		},
	});

	if (tokenError || !token) {
		return (
			<div className="space-y-4">
				<ErrorState
					title="Invalid reset link"
					description="This password reset link is missing, invalid, or expired."
				/>
				<div className="flex justify-center">
					<Link href={"/auth/forgot-password" as Route}>
						<Button>Request a new link</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<FormSection
			title="Choose a new password"
			description="Set a new password for your account."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<form.Field name="password">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>New password</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id={field.name}
									name={field.name}
									type={showPassword ? "text" : "password"}
									placeholder="At least 8 characters"
									autoComplete="new-password"
									className="px-9"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								<button
									type="button"
									onClick={() => setShowPassword((value) => !value)}
									className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
							</div>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-destructive text-sm">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

				<form.Field name="confirmPassword">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>Confirm password</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id={field.name}
									name={field.name}
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Repeat your new password"
									autoComplete="new-password"
									className="px-9"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword((value) => !value)}
									className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									aria-label={
										showConfirmPassword ? "Hide password" : "Show password"
									}
								>
									{showConfirmPassword ? (
										<EyeOff className="size-4" />
									) : (
										<Eye className="size-4" />
									)}
								</button>
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
							{isSubmitting ? "Updating password..." : "Update password"}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="pt-2 text-center text-muted-foreground text-sm">
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
