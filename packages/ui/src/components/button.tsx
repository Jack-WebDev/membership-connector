import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@membership-connector-app/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-medium text-xs outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(47_111_163_/_0.18)] hover:bg-[#285f8c]",
				outline:
					"border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-[#cfdeeb] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				ghost:
					"hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
				destructive:
					"bg-destructive text-white hover:bg-[#a74f4f] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/80 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/70",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				xs: "h-7 gap-1 rounded-full px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-9 gap-1 rounded-full px-3.5 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-10",
				"icon-xs": "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8 rounded-full",
				"icon-lg": "size-11 rounded-full",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
