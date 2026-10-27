import type { Metadata } from "next";
import { Hanken_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { HtmlLang } from "@/components/HtmlLang";

const hanken = Hanken_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-hanken",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spline-mono",
});

export const metadata: Metadata = {
  title: "Money Flow",
  description: "Personal finance with double-entry accounting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Pre-paint settings init (public/mf-ui-init.js). async src makes it a
            React hoistable script (no dev warning); blocking="render" keeps the
            before-first-paint guarantee in browsers that support it. */}
        {/* eslint-disable-next-line react/no-unknown-property -- blocking="render" is a valid HTML attribute the plugin doesn't know yet */}
        <script async src="/mf-ui-init.js" blocking="render" />
      </head>
      <body className={`${hanken.variable} ${splineMono.variable} font-sans`}>
        <Providers>
          <HtmlLang />
          {children}
        </Providers>
      </body>
    </html>
  );
}
