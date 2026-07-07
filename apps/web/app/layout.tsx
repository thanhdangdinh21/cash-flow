import type { Metadata } from "next";
import Script from "next/script";
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

// Pre-paint settings init — keep in sync with components/ui-settings.tsx.
const THEME_INIT_SCRIPT = `try {
  var s = JSON.parse(localStorage.getItem('mf-ui') || '{}');
  document.documentElement.setAttribute('data-theme', s.theme === 'dark' ? 'dark' : 'light');
  document.documentElement.setAttribute('data-density', s.density === 'compact' ? 'compact' : 'comfortable');
  document.documentElement.setAttribute('data-hints', s.showKeyHints === false ? 'off' : 'on');
} catch (e) {}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* next/script keeps React from re-rendering a raw <script> on client
            navigations (console error flood) while still injecting pre-paint. */}
        <Script
          id="mf-ui-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
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
