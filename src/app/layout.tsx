import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
	title: "Widget by Barnav",
	description:
		"Widget is a Hack Club challenge where you ship a browser extension and get browser merch.",
	icons: {
		icon: [{ url: "/favicon.ico" }, { url: "/favicon.png", type: "image/png" }],
		apple: [{ url: "/apple-touch-icon.png" }],
	},
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={GeistSans.variable} lang="en">
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
