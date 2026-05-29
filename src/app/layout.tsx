import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/layout/ScrollToTop";
import PageLoader from "@/components/layout/PageLoader";
import PageTracker from "@/components/analytics/PageTracker";
import GlobalChat from "@/components/chat/GlobalChat";
import AuthProvider, { type AuthProfile } from "@/components/auth/AuthProvider";
import QueryProvider from "@/lib/query/QueryProvider";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

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
        url: `${SITE_URL}/logo.webp`,
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
    images: [`${SITE_URL}/logo.webp`],
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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.webp", type: "image/webp" },
    ],
    apple: "/logo.webp",
  },

  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([
    getLocale(),
    getMessages(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: AuthProfile | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select(
        "id, username, role, avatar_url, onboarding_completed, is_blocked, blocked_reason, blocked_at",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (profileRow) {
      initialProfile = profileRow as AuthProfile;
    }
  }

  const supabaseOrigin = (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin;
    } catch {
      return "";
    }
  })();

  return (
    <html lang={locale} className={playfair.variable}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
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
          <AuthProvider initialUser={user} initialProfile={initialProfile}>
            <QueryProvider>
              <PageLoader>
              <ScrollToTop />
              <Suspense fallback={null}>
                <PageTracker />
              </Suspense>
              {children}
              <GlobalChat />
              </PageLoader>
            </QueryProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
