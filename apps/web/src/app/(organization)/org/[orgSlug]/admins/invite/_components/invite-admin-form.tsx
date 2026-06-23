"use client";

import type { OrganizationAdminRoleValue } from "@membership-connector-app/api/organization-admin/types";
import { Button } from "@membership-connector-app/ui/components/button";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@membership-connector-app/ui/components/native-select";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ASSIGNABLE_ROLE_OPTIONS: {
	value: OrganizationAdminRoleValue;
	label: string;
}[] = [
	{ value: "admin", label: "Admin" },
	{ value: "membership_manager", label: "Membership manager" },
	{ value: "finance_manager", label: "Finance manager" },
	{ value: "content_manager", label: "Content manager" },
	{ value: "reviewer", label: "Reviewer" },
];

type InviteAdminFormProps = {
	orgSlug: string;
	canAssignOwner: boolean;
};

function InviteAdminForm({ orgSlug, canAssignOwner }: InviteAdminFormProps) {
	const router = useRouter();

	const inviteMutation = useMutation(
		trpc.organizationAdmin.invite.mutationOptions(),
	);

	const form = useForm({
		defaultValues: {
			email: "",
			role: "admin" as OrganizationAdminRoleValue,
		},
		onSubmit: async ({ value }) => {
			try {
				await inviteMutation.mutateAsync({
					organizationSlug: orgSlug,
					email: value.email,
					role: value.role,
				});
				toast.success("Invite sent");
				router.push(`/org/${orgSlug}/admins` as Route);
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Could not send invite",
				);
			}
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
			<form.Field
				name="email"
				validators={{
					onSubmit: ({ value }) =>
						value.trim().length === 0
							? "Enter an email"
							: !EMAIL_PATTERN.test(value.trim())
								? "Enter a valid email"
								: undefined,
				}}
			>
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="admin@example.com"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={String(error)} className="text-destructive text-sm">
								{String(error)}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="role">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Role</Label>
						<NativeSelect
							id={field.name}
							name={field.name}
							className="w-full"
							value={field.state.value}
							onChange={(e) =>
								field.handleChange(e.target.value as OrganizationAdminRoleValue)
							}
						>
							{canAssignOwner ? (
								<NativeSelectOption value="owner">Owner</NativeSelectOption>
							) : null}
							{ASSIGNABLE_ROLE_OPTIONS.map((option) => (
								<NativeSelectOption key={option.value} value={option.value}>
									{option.label}
								</NativeSelectOption>
							))}
						</NativeSelect>
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
						{isSubmitting ? "Sending..." : "Send invite"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

export { InviteAdminForm };
