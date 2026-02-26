import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика за бисквитки | TravelInvoices",
  description: "Политика за използване на бисквитки на платформата TravelInvoices",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          &larr; Обратно към началната страница
        </Link>

        <h1 className="text-3xl font-bold mb-2">Политика за бисквитки</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Последна актуализация: 26 февруари 2026 г.
        </p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground [&_li]:mb-1">
          <section>
            <h2>1. Какво са бисквитките?</h2>
            <p>
              Бисквитките (cookies) са малки текстови файлове, които се съхраняват
              на вашето устройство (компютър, таблет, смартфон) при посещение на
              уебсайт. Те позволяват на сайта да запомни информация за вашето
              посещение, което улеснява следващите ви посещения и прави сайта
              по-полезен за вас.
            </p>
            <p>
              Настоящата политика е изготвена в съответствие с Директива
              2002/58/ЕО (ePrivacy Directive), Регламент (ЕС) 2016/679 (GDPR)
              и Закона за електронните съобщения на Република България.
            </p>
          </section>

          <section>
            <h2>2. Видове бисквитки, които използваме</h2>

            <h3>2.1. Задължителни (стриктно необходими)</h3>
            <p>
              Тези бисквитки са необходими за основното функциониране на
              Платформата. Без тях не можете да използвате услугата. Не изискват
              вашето съгласие.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Бисквитка
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Цел
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Срок
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2">sb-*-auth-token</td>
                    <td className="px-3 py-2">
                      Автентикация на потребителя (Supabase Auth)
                    </td>
                    <td className="px-3 py-2">Сесия</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2">sb-*-auth-token-code-verifier</td>
                    <td className="px-3 py-2">
                      PKCE верификация при OAuth вход
                    </td>
                    <td className="px-3 py-2">Сесия</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-2">__stripe_mid</td>
                    <td className="px-3 py-2">
                      Предотвратяване на измами при плащане (Stripe)
                    </td>
                    <td className="px-3 py-2">1 година</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">__stripe_sid</td>
                    <td className="px-3 py-2">
                      Сесия на плащане (Stripe)
                    </td>
                    <td className="px-3 py-2">30 минути</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.2. Функционални</h3>
            <p>
              Тези бисквитки запомнят вашите предпочитания и подобряват
              изживяването ви. Изискват вашето съгласие.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Бисквитка
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Цел
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">
                      Срок
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2">cookie-consent</td>
                    <td className="px-3 py-2">
                      Запомня вашия избор относно бисквитките
                    </td>
                    <td className="px-3 py-2">1 година</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>2.3. Аналитични</h3>
            <p>
              Тези бисквитки ни помагат да разберем как потребителите използват
              Платформата, за да я подобряваме. Данните са анонимизирани. Изискват
              вашето съгласие.
            </p>
            <p className="text-xs">
              Към момента TravelInvoices не използва аналитични бисквитки. При
              бъдещо въвеждане ще актуализираме тази секция и ще поискаме вашето
              съгласие.
            </p>

            <h3>2.4. Маркетингови</h3>
            <p>
              Маркетинговите бисквитки се използват за показване на реклами,
              съобразени с вашите интереси. Изискват изрично съгласие.
            </p>
            <p className="text-xs">
              Към момента TravelInvoices не използва маркетингови бисквитки. При
              бъдещо въвеждане ще актуализираме тази секция и ще поискаме вашето
              изрично съгласие.
            </p>
          </section>

          <section>
            <h2>3. Бисквитки от трети страни</h2>
            <p>
              Някои бисквитки се поставят от услуги на трети страни, които
              използваме:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Supabase</strong> — за автентикация и управление на
                сесията. Политика за поверителност:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <strong>Stripe</strong> — за сигурна обработка на плащания.
                Политика за поверителност:{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  stripe.com/privacy
                </a>
              </li>
              <li>
                <strong>Vercel</strong> — за хостинг и оптимизация на
                производителността. Политика за поверителност:{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Вашият избор</h2>
            <h3>4.1. Съгласие</h3>
            <p>
              При първото ви посещение на Платформата ви показваме банер за
              бисквитки, чрез който можете да:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Приемете всички</strong> — активирате всички категории
                бисквитки
              </li>
              <li>
                <strong>Само необходимите</strong> — приемате само задължителните
                бисквитки
              </li>
            </ul>
            <p>
              Можете да промените избора си по всяко време чрез настройките на
              вашия браузър.
            </p>

            <h3>4.2. Управление чрез браузър</h3>
            <p>
              Можете да управлявате бисквитките чрез настройките на браузъра си.
              Повечето браузъри позволяват:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Да преглеждате съхранените бисквитки</li>
              <li>Да изтривате отделни или всички бисквитки</li>
              <li>Да блокирате бисквитки от определени сайтове</li>
              <li>Да блокирате бисквитки от трети страни</li>
            </ul>
            <p>
              <strong>Внимание:</strong> Блокирането на задължителните бисквитки
              може да попречи на правилното функциониране на Платформата.
            </p>
          </section>

          <section>
            <h2>5. Срок на съхранение</h2>
            <p>Бисквитките се делят на два вида по срок на съхранение:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Сесийни бисквитки</strong> — изтриват се автоматично
                при затваряне на браузъра
              </li>
              <li>
                <strong>Постоянни бисквитки</strong> — остават на устройството
                ви за определен период (посочен в таблиците по-горе)
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Промени в политиката</h2>
            <p>
              Можем да актуализираме настоящата Политика за бисквитки
              периодично. При въвеждане на нови категории бисквитки ще поискаме
              вашето съгласие отново. Датата на последна актуализация е посочена в
              началото на документа.
            </p>
          </section>

          <section>
            <h2>7. Контакт</h2>
            <p>
              При въпроси относно бисквитките, моля свържете се с нас:
            </p>
            <ul className="list-none pl-0 space-y-1">
              <li>
                <strong>Имейл:</strong> support@travelinvoices.com
              </li>
              <li>
                <strong>Уебсайт:</strong> www.travelinvoices.com
              </li>
            </ul>
            <p>
              За повече информация относно защитата на личните данни вижте нашата{" "}
              <Link href="/privacy" className="text-violet-400 hover:underline">
                Политика за поверителност
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
