import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/layout/ScrollToTop";
import PageLoader from "@/components/layout/PageLoader";
import PageTracker from "@/components/analytics/PageTracker";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const SITE_URL = "https://www.nicemodels.ch";
const SITE_NAME = "NiceModels.ch";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "NiceModels.ch – Das Erotikportal der Schweiz",
    template: "%s | NiceModels.ch",
  },
  description:
    "NiceModels.ch – Das führende Erotikportal der Schweiz. Finde verifizierte Escort-Models, Clubs und Agenturen in Zürich, Bern, Basel, Genf und der ganzen Schweiz.",
  keywords: [
    "Escort Schweiz",
    "Escort Zürich",
    "Escort Bern",
    "Escort Basel",
    "Escort Genf",
    "Erotikportal Schweiz",
    "NiceModels",
    "Begleitservice Schweiz",
    "Models Schweiz",
    "Clubs Schweiz",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],

  openGraph: {
    type: "website",
    locale: "de_CH",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "NiceModels.ch – Das Erotikportal der Schweiz",
    description:
      "Finde verifizierte Escort-Models, Clubs und Agenturen in der ganzen Schweiz.",
    images: [
      {
        url: "/logo.webp",
        width: 512,
        height: 512,
        alt: "NiceModels.ch Logo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "NiceModels.ch – Das Erotikportal der Schweiz",
    description:
      "Finde verifizierte Escort-Models, Clubs und Agenturen in der ganzen Schweiz.",
    images: ["/logo.webp"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },

  verification: {},
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className={playfair.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              description:
                "Das führende Erotikportal der Schweiz – verifizierte Escort-Models, Clubs und Agenturen.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/logo.webp`,
                },
              },
            }),
          }}
        />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0 }}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PageLoader>
            <ScrollToTop />
            <Suspense fallback={null}>
              <PageTracker />
            </Suspense>
            {children}
          </PageLoader>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
