import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "./chrome/ThemeScript";
import { MobileStoreBanner } from "./chrome/MobileStoreBanner";
import { detectMobilePlatform } from "./chrome/ua";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://armal.news",
  ),
  title: "Armal News",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const hdrs = await headers();
  const platform = detectMobilePlatform(hdrs.get("user-agent"));

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${inter.variable} ${jetbrains.variable}`}
      // The pre-paint script in <head> may add `theme-light` / `theme-dark`
      // class and `data-*-dismissed` attributes before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className={`bg-bg text-fg font-body${
          platform ? " has-mobile-banner" : ""
        }`}
      >
        {platform && <MobileStoreBanner platform={platform} />}
        {children}
      </body>
    </html>
  );
}
