import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Script from "next/script";

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
				<Script
					async
					src="https://plausible.io/js/pa-ro_EID0PYnn-M8JQ3MWw2.js"
					strategy="afterInteractive"
				/>
				<Script id="plausible-init" strategy="afterInteractive">
					{`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}
				</Script>
			</body>
		</html>
	);
}
