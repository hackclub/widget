import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

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

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="en">
			<body>
				<TRPCReactProvider>{children}</TRPCReactProvider>
			</body>
		</html>
	);
}
