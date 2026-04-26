import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { LocaleProvider } from "@/lib/i18n/context";
import { getLocaleFromCookies } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "TravelInvoices — Софтуер за Фактури и Протоколи за Марж | Туроператори",
    template: "%s | TravelInvoices",
  },
  description:
    "Софтуер за туристически агенции и туроператори. AI извличане на данни от PDF фактури, автоматични протоколи за марж по чл. 117 ЗДДС (Раздел А, Б, В), изчисляване на ДДС по маржов метод. Експорт в Excel и PDF.",
  keywords: [
    // Primary
    "софтуер за фактури туроператор",
    "програма за фактуриране туристическа агенция",
    "протокол за марж чл 117 ЗДДС",
    "маржов метод ЗДДС",
    "управление на фактури туризъм",
    // VAT & Margin
    "облагане на маржа туристически услуги",
    "обща туристическа услуга ДДС",
    "изчисляване на ДДС марж",
    "данъчна основа марж туроператор",
    "протоколи по ЗДДС туроператор",
    // Features
    "AI извличане данни фактура",
    "OCR фактури България",
    "автоматично извличане данни от PDF фактура",
    "експорт протокол Excel",
    "онлайн фактуриране туристическа агенция",
    // Long-tail
    "протокол раздел А раздел Б раздел В марж",
    "приходни разходни фактури туристическа агенция",
    "комисионни фактури туризъм",
    "софтуер за генериране на протоколи за марж",
    "електронни фактури туризъм",
    // Legal
    "чл 136 ЗДДС",
    "чл 139 ЗДДС",
    "глава 16 ЗДДС",
    // Euro
    "фактури в евро туроператор",
  ],
  authors: [{ name: "TravelInvoices" }],
  creator: "TravelInvoices",
  publisher: "TravelInvoices",
  metadataBase: new URL("https://www.travelinvoices.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: "https://www.travelinvoices.com",
    siteName: "TravelInvoices",
    title:
      "TravelInvoices — Софтуер за Фактури и Протоколи за Марж | Туроператори",
    description:
      "AI извличане на данни от PDF фактури и автоматични протоколи за марж по ЗДДС. Създадено за туристически агенции в България. 14 дни безплатен тест.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelInvoices — Фактури и Протоколи за Туроператори",
    description:
      "Качете PDF фактура → AI извлича данните → Протокол за марж по ЗДДС с раздели А, Б и В. За туристически агенции.",
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
  category: "business",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookies();

  return (
    <html lang={locale} className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1266368978810709');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1266368978810709&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <LocaleProvider initialLocale={locale}>
            {children}
          </LocaleProvider>
          <Toaster />
          <Analytics />
        </TooltipProvider>
      </body>
    </html>
  );
}
