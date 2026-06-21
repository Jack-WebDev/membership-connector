import type { Metadata } from "next";

import "../index.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
	title: "Membership Connector",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="scroll-smooth">
			<body className="antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
