"use client";

import { memberOnboardingInput } from "@membership-connector-app/api/onboarding/types";
import { Button } from "@membership-connector-app/ui/components/button";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

export function MemberOnboardingForm() {
	const router = useRouter();
	const mutation = useMutation(
		trpc.onboarding.completeMember.mutationOptions(),
	);

	const form = useForm({
		defaultValues: {
			firstName: "",
			lastName: "",
			phone: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const result = await mutation.mutateAsync(value);
				toast.success("You're all set");
				router.push(result.redirectPath as Route);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Could not complete onboarding",
				);
			}
		},
		validators: {
			onSubmit: memberOnboardingInput,
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="grid gap-4 sm:grid-cols-2"
		>
			<form.Field name="firstName">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>First name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Ava"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="lastName">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Last name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Mokoena"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="phone">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Phone</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="+27 82 000 0000"
						/>
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
						className="sm:col-span-2"
						disabled={!canSubmit || isSubmitting}
					>
						{isSubmitting ? "Saving..." : "Continue as member"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
