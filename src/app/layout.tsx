import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/layout/ScrollToTop";
import PageLoader from "@/components/layout/PageLoader";
import PageTracker from "@/components/analytics/PageTracker";
import GlobalChat from "@/components/chat/GlobalChat";
import AuthProvider, { type AuthProfile } from "@/components/auth/AuthProvider";
import QueryProvider from "@/lib/query/QueryProvider";
import AgeGate from "@/components/AgeGate";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const SITE_URL = "https://nicemodels.ch";
const SITE_NAME = "NiceModels.ch";

// Profile row for the navbar/auth context, cached per user for 30s so repeat
// navigations skip a Supabase round trip. Uses the service-role client because
// unstable_cache callbacks cannot read request cookies. Client-side
// refreshProfile() still provides immediate updates inside dashboards.
const getCachedProfile = unstable_cache(
  async (uid: string): Promise<AuthProfile | null> => {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select(
          "id, username, role, avatar_url, onboarding_completed, tutorial_completed, phone, date_of_birth, is_blocked, blocked_reason, blocked_at",
        )
        .eq("id", uid)
        .maybeSingle();
      return (data as AuthProfile | null) ?? null;
    } catch {
      // On any failure return null — AuthProvider fetches the profile
      // client-side when initialProfile is missing.
      return null;
    }
  },
  ["layout-auth-profile"],
  { revalidate: 30 },
);

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

  // The proxy middleware (updateSession) already validated and refreshed the
  // auth token via getUser() on this same request, so reading the session from
  // cookies here is safe and avoids a second Supabase Auth round trip.
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let initialProfile: AuthProfile | null = null;
  if (user) {
    initialProfile = await getCachedProfile(user.id);
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
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/logo.webp`,
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer service",
                  email: "info@nicemodels.ch",
                  telephone: "+41783339396",
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
          {/* Age gate: client-side overlay only. SSR renders null so bots
              receive full HTML. Cookie is read client-side after hydration. */}
          <AgeGate />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
