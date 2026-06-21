import { Button } from "@membership-connector-app/ui/components/button";
import { CheckCircle2, ShieldCheck, Users2 } from "lucide-react";
import Link from "next/link";

const highlights = [
	{
		icon: Users2,
		title: "One place for every member",
		description:
			"Track applications, renewals, and messages without switching tools.",
	},
	{
		icon: ShieldCheck,
		title: "Built on trusted auth",
		description:
			"Your account is protected by the same sign-in flow powering the whole platform.",
	},
	{
		icon: CheckCircle2,
		title: "Up and running in minutes",
		description:
			"No setup calls, no onboarding forms — just create an account and go.",
	},
];

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							"radial-gradient(circle at 15% 20%, rgb(255 255 255 / 0.16), transparent 35%), radial-gradient(circle at 85% 75%, rgb(255 255 255 / 0.12), transparent 40%)",
					}}
				/>

				<Link href="/" className="relative z-10 flex items-center gap-3">
					<span className="font-(family-name:--font-display) inline-flex size-11 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/10 text-xl">
						MC
					</span>
					<span className="font-(family-name:--font-display) text-2xl leading-none">
						Membership Connector
					</span>
				</Link>

				<div className="relative z-10 max-w-md space-y-8">
					<h1 className="font-(family-name:--font-display) text-4xl leading-tight sm:text-5xl">
						Manage every membership in one modern workspace.
					</h1>
					<div className="space-y-5">
						{highlights.map((item) => (
							<div key={item.title} className="flex items-start gap-3">
								<span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
									<item.icon className="size-4" />
								</span>
								<div>
									<p className="font-medium">{item.title}</p>
									<p className="text-primary-foreground/75 text-sm">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				<p className="relative z-10 text-primary-foreground/60 text-sm">
					© {new Date().getFullYear()} Membership Connector. All rights
					reserved.
				</p>
			</div>

			<div className="flex flex-col px-4 py-8 sm:px-6 lg:px-12 lg:py-10">
				<div className="flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2 lg:hidden">
						<span className="font-(family-name:--font-display) inline-flex size-9 items-center justify-center rounded-full border border-border/80 bg-card text-base text-primary shadow-[var(--shadow-card)]">
							MC
						</span>
						<span className="font-(family-name:--font-display) text-foreground text-xl leading-none">
							Membership Connector
						</span>
					</Link>
					<Link href="/" className="ml-auto">
						<Button variant="ghost" size="sm">
							Back to home
						</Button>
					</Link>
				</div>

				<div className="flex flex-1 items-center justify-center py-8">
					<div className="w-full max-w-md">{children}</div>
				</div>
			</div>
		</div>
	);
}
