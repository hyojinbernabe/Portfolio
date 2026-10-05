import type { Metadata } from "next";
import { Geist, Geist_Mono, Anton, Archivo } from "next/font/google";
import { LenisProvider } from "@/components/motion/lenis-provider";
import { AppBars } from "@/components/chrome/app-bars";
import { KeyLights } from "@/components/chrome/key-lights";
import { SiteFooter } from "@/components/sections/site-footer";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site-config";
import "./globals.css";

// Set the theme class before paint so there's no light-to-dark flash.
const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Heavy, blocky, single-weight display face built for huge poster-style
// headlines, more ink coverage per character than Oswald, reads as "fills
// the screen" at the same font-size.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Wide-set display face for the About section: variable Archivo carries a
// width axis (62 to 125), so at width 125 + black weight it reads big and wide.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Hyojin Bernabe",
    "full stack developer",
    "Next.js developer",
    "Flutter developer",
    "remote developer Philippines",
    "software developer portfolio",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${archivo.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      {/* overflow-x-clip: wide decorative layers (hero splatter, marquee
          copies) can never create a horizontal scrollbar; clip (unlike
          hidden) adds no scroll container, so vertical flow is untouched. */}
      <body className="flex min-h-full flex-col overflow-x-clip">
        <LenisProvider>
          <KeyLights />
          <AppBars />
          <div className="flex flex-1 flex-col pt-16 lg:px-[125px] lg:pt-0">
            {children}
            <SiteFooter />
          </div>
        </LenisProvider>
      </body>
    </html>
  );
}
