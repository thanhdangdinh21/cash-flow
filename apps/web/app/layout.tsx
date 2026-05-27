import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { HtmlLang } from "@/components/HtmlLang";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <HtmlLang />
          {children}
        </Providers>
      </body>
    </html>
  );
}
