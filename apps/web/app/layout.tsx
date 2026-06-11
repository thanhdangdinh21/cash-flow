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
    <html lang="en">
      <body className={`${hanken.variable} ${splineMono.variable} font-sans`}>
        <Providers>
          <HtmlLang />
          {children}
        </Providers>
      </body>
    </html>
  );
}
