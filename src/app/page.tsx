import { LandingPage } from "@/components/landing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "TravelInvoices — Софтуер за Фактури и Протоколи за Марж | Туроператори",
  description:
    "Качете PDF фактура, AI извлича данните автоматично. Генерирайте протоколи за марж по чл. 117 ЗДДС с раздели А, Б и В. Създадено за туроператори и туристически агенции в България. 14 дни безплатен тест.",
  alternates: {
    canonical: "https://www.travelinvoices.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TravelInvoices",
  url: "https://www.travelinvoices.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-базиран софтуер за управление на фактури и протоколи по ЗДДС маржов метод за туристически агенции и туроператори в България.",
  offers: [
    {
      "@type": "Offer",
      name: "Професионален план",
      price: "20",
      priceCurrency: "EUR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Бизнес план",
      price: "40",
      priceCurrency: "EUR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
    },
  ],
  featureList: [
    "AI извличане на данни от PDF фактури",
    "Автоматични протоколи за марж по чл. 117 ЗДДС",
    "Изчисляване на ДДС по маржов метод (Раздел А, Б, В)",
    "Експорт в Excel и PDF",
    "GDPR съвместимост, данни в ЕС",
  ],
  inLanguage: "bg",
  availableLanguage: "bg",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Какво включва безплатният тестов период?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Получавате пълен достъп до всички функции за 14 дни. Въвеждате картата си при регистрация, но не ви таксуваме през първите 14 дни. Ако решите да не продължавате — откажете се с 1 клик от настройките на акаунта.",
      },
    },
    {
      "@type": "Question",
      name: "Как се извличат данните от фактурите?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Качвате PDF файл и нашият специализиран софтуер автоматично разпознава номера на документа, датата на издаване и общата стойност. Можете да прегледате и коригирате данните преди записване.",
      },
    },
    {
      "@type": "Question",
      name: "Поддържате ли маржовия метод по ЗДДС?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да! TravelInvoices е създаден специално за туристически агенции, работещи по маржовия метод (чл. 136–141 ЗДДС). Автоматично генерирани протоколи с Раздел А (получени суми), Раздел Б (платени суми) и Раздел В (ДДС калкулации).",
      },
    },
    {
      "@type": "Question",
      name: "Сигурни ли са данните ми?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Данните се съхраняват криптирано в ЕС дата центрове. Всеки потребител има достъп само до собствените си данни чрез Row Level Security. Спазваме GDPR.",
      },
    },
    {
      "@type": "Question",
      name: "Мога ли да се откажа по всяко време?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да. Няма дългосрочни договори. От настройките на акаунта натискате \"Управлявай абонамент\" и се отказвате с 1 клик.",
      },
    },
    {
      "@type": "Question",
      name: "В какви формати мога да експортирам?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Поддържаме експорт в Excel (.xlsx) и PDF. Форматът следва стандартната бланка за протокол по ЗДДС маржов метод.",
      },
    },
    {
      "@type": "Question",
      name: "Какви видове протоколи поддържате?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Поддържаме три вида протоколи: 'в ЕС' (ДДС 20%), 'извън ЕС' (ДДС 0%) и 'Смесен' (за услуги едновременно в и извън ЕС, с ДДС ставка за всяка фактура поотделно). Всички са съобразени с маржовия метод по чл. 136–141 ЗДДС.",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LandingPage />
    </>
  );
}
