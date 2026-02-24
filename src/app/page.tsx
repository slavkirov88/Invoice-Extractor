import { LandingPage } from "@/components/landing/LandingPage";

export const metadata = {
  title: "TravelInvoices — Автоматично управление на фактури и ДДС протоколи",
  description:
    "AI-базиран инструмент за туристически агенции. Качвате PDF фактура, извличаме данните, създаваме протокол по ЗДДС маржов метод. Спестете 20+ часа месечно.",
  openGraph: {
    title: "TravelInvoices — Автоматично управление на фактури и ДДС протоколи",
    description:
      "Спестете 20+ часа месечно с AI-базирано извличане на данни от фактури и автоматично генериране на протоколи за маржов метод.",
    type: "website",
    url: "https://www.travelinvoices.com",
  },
};

export default function Home() {
  return <LandingPage />;
}
