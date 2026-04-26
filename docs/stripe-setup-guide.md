# Stripe настройка — Пълен guide за TravelInvoices

## СТЪПКА 1: Определи правилната структура
- [ ] **1 организация → 1 акаунт** за TravelInvoices
- [ ] Ако вторият акаунт е за друг бизнес — остави го. Ако е дубликат — изтрий го.
- [ ] Провери дали си в правилния акаунт (горе вляво в Dashboard-а)

## СТЪПКА 2: Попълни бизнес информацията
Отиди в **Settings → Business details** и попълни:
- [ ] **Тип бизнес:** Company / Sole proprietor (каквото е фирмата ти)
- [ ] **Име на фирмата:** точно както е в Търговския регистър
- [ ] **ЕИК:** на фирмата
- [ ] **Адрес:** регистрационен адрес на фирмата
- [ ] **Уебсайт:** `https://www.travelinvoices.com`
- [ ] **Описание на бизнеса:** "SaaS софтуер за управление на фактури и ДДС протоколи за туристически агенции"

## СТЪПКА 3: Лична верификация (KYC)
Settings → Account verifications:
- [ ] **Пълно име:** точно както е на личната карта
- [ ] **Дата на раждане**
- [ ] **Адрес**
- [ ] **Лична карта или паспорт** — снимай/сканирай и качи (JPEG/PNG/PDF, НЕ screenshot)
- [ ] **Може да поиска селфи** — за сверка с документа

## СТЪПКА 4: Банкова сметка
Settings → Bank accounts and scheduling:
- [ ] **Добави банкова сметка в EUR** (IBAN)
- [ ] Банката трябва да е на името на фирмата
- [ ] **Провери payout schedule** — default е автоматични изплащания

## СТЪПКА 5: Брандиране
Settings → Branding:
- [ ] **Лого** на TravelInvoices
- [ ] **Цвят:** #7c3aed (виолетовия от приложението)
- [ ] **Statement descriptor:** `TRAVELINVOICES` (max 22 символа)
- [ ] **Кратък descriptor:** `TRAVELINV`

## СТЪПКА 6: Настройки на продукти и цени
Dashboard → Products:
- [ ] **Продукт 1:** "TravelInvoices Старт" — 20 EUR/месец (recurring), до 200 фактури и 50 протокола
- [ ] **Продукт 2:** "TravelInvoices Бизнес" — 40 EUR/месец (recurring), неограничени
- [ ] **Trial период:** 14 дни

## СТЪПКА 7: Customer Portal
Settings → Billing → Customer portal:
- [ ] Включи cancel subscription
- [ ] Включи switch plans
- [ ] Включи update payment method
- [ ] Включи invoice history

## СТЪПКА 8: Сигурност
- [ ] **Включи 2FA** — Settings → Security (authenticator app, НЕ SMS)
- [ ] **Webhook endpoint:** `https://www.travelinvoices.com/api/stripe/webhook`
- [ ] **Webhook events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

## СТЪПКА 9: Тестване
- [ ] Успешно плащане: `4242 4242 4242 4242`
- [ ] Отказана карта: `4000 0000 0000 0002`
- [ ] 3D Secure: `4000 0027 6000 3184`
- [ ] Провери целия flow: регистрация → trial → checkout → subscription active
- [ ] Провери cancel flow
- [ ] Провери webhook events

## СТЪПКА 10: Go Live
- [ ] Превключи Test → Live mode
- [ ] Смени API ключовете в Vercel:
  - `STRIPE_SECRET_KEY` → sk_live_...
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → pk_live_...
  - `STRIPE_WEBHOOK_SECRET` → нов за live mode
- [ ] Тестово плащане с реална карта (после refund)

## Източници
- https://docs.stripe.com/get-started/account/checklist
- https://docs.stripe.com/get-started/checklist/go-live
- https://support.stripe.com/questions/what-do-i-need-to-do-to-verify-my-stripe-account
