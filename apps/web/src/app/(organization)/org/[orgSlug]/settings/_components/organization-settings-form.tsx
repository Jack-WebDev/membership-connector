"use client";

import { organizationUpdateInput } from "@membership-connector-app/api/organization/types";
import { Button } from "@membership-connector-app/ui/components/button";
import { Input } from "@membership-connector-app/ui/components/input";
import { Label } from "@membership-connector-app/ui/components/label";
import { Textarea } from "@membership-connector-app/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type OrganizationSettingsFormValues = {
	name: string;
	description: string;
	websiteUrl: string;
	email: string;
	phone: string;
};

type OrganizationSettingsFormProps = {
	orgSlug: string;
	defaultValues: OrganizationSettingsFormValues;
};

function OrganizationSettingsForm({
	orgSlug,
	defaultValues,
}: OrganizationSettingsFormProps) {
	const router = useRouter();

	const updateMutation = useMutation(
		trpc.organization.update.mutationOptions(),
	);

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync(
				{ organizationSlug: orgSlug, ...value },
				{
					onSuccess: () => {
						toast.success("Organization updated");
						router.refresh();
					},
					onError: (error) => {
						toast.error(error.message);
					},
				},
			);
		},
		validators: {
			onSubmit: organizationUpdateInput,
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
			<form.Field name="name">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Organization name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="LulaFi Business Network"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor={field.name}>Description</Label>
						<Textarea
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Tell members what your organization is about"
							rows={4}
						/>
					</div>
				)}
			</form.Field>

			<form.Field name="websiteUrl">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Website URL</Label>
						<Input
							id={field.name}
							name={field.name}
							type="url"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="https://example.com"
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Contact email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="hello@example.com"
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
					<div className="space-y-2">
						<Label htmlFor={field.name}>Phone</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="+27 12 345 6789"
						/>
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
						{isSubmitting ? "Saving..." : "Save changes"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}

export { OrganizationSettingsForm };
