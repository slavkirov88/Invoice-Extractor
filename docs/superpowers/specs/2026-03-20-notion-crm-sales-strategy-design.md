# Notion CRM + Sales Strategy Design
**Date:** 2026-03-20
**Product:** Invoice Extractor
**Author:** Founder-led sales setup

---

## Overview

MCP-driven система за събиране на данни за туристически агенции в България и управление на продажбения процес чрез Notion CRM. Claude действа като sales assistant — командваш с natural language, Apify събира данни, Notion ги организира.

---

## Architecture

```
Claude Code (с MCP)
    ├── Apify MCP → Google Maps Scraper / Google Search Scraper
    └── Notion MCP → чете/пише/обновява CRM базата
```

### MCP Сървъри
- **Notion MCP:** `@notionhq/notion-mcp-server` — официален, Integration Token
- **Apify MCP:** `@apify/actors-mcp-server` — API Key от Apify console

**Конфигурация в `~/.claude/settings.json`:**
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": { "NOTION_API_KEY": "<your-integration-token>" }
    },
    "apify": {
      "command": "npx",
      "args": ["-y", "@apify/actors-mcp-server"],
      "env": { "APIFY_API_TOKEN": "<your-api-key>" }
    }
  }
}
```

**Как да получиш Notion Integration Token:**
1. Отиди на notion.so/my-integrations → "New integration"
2. Копирай "Internal Integration Token" (започва с `secret_`)

**Как да споделиш Notion базата с интеграцията:**
1. Отвори базата данни в Notion
2. Горе вдясно → "..." (три точки) → "Connections"
3. Намери твоята интеграция → "Confirm"

---

## Notion CRM Структура

**База данни:** "Туристически Агенции БГ"

| Колона | Тип | Описание |
|--------|-----|----------|
| Агенция | Title | Име |
| Град | Select | София / Пловдив / Варна / Бургас / Друг |
| Телефон | Phone | От Google Maps |
| Имейл | Email | Намерен при outreach |
| Уебсайт | URL | От Google Maps |
| Размер | Select | Малка / Средна — попълва се ръчно; прокси: брой ревюта в Google |
| Статус | Select | 🆕 Нов / 📞 Контактнат / 🎬 Демо изпратено / 🤝 Преговори / ✅ Клиент / ❌ Отказал |
| Контактнат | Checkbox | Бързо филтриране |
| Демо изпратено | Checkbox | Бързо филтриране |
| Дата на контакт | Date | Последен контакт |
| Follow-up дата | Date | Кога да се върнеш |
| Канал | Select | Имейл / Телефон / LinkedIn / Препоръка |
| Бележки | Text | Свободен текст |
| Рейтинг | Number | Google рейтинг |
| Приоритет | Select | 🔥 Висок / 🟡 Среден / ⬜ Нисък |
| Източник | Select | Google Maps / Препоръка / Реклама |

**Views:**
- Kanban по Статус (основен pipeline view)
- Таблица (пълен преглед)
- Follow-up днес (филтър: follow-up дата = днес)
- Неконтактвани (филтър: Контактнат = false)

---

## Data Collection Strategy

**Инструмент:** Apify Google Maps Scraper (`compass/google-maps-scraper`)
**Търсения:**
- "туристически агенции София"
- "туристически агенции Пловдив"
- "туристически агенции Варна"
- "туристически агенции Бургас"
- "travel agency Bulgaria"

**Target:** 200-500 агенции в Week 1

**Приоритизиране:**
- Висок: уебсайт + рейтинг 4.0+ + 20+ ревюта + средна агенция
- Нисък: без уебсайт, без телефон, без ревюта

---

## Sales Strategy

### Фаза 1 — Събиране (Week 1)
Apify дърпа всички агенции → Claude почиства → Notion получава базата.

### Фаза 2 — Приоритизиране (Week 1)
Маркиране на Висок/Среден/Нисък приоритет по критериите горе.

### Фаза 3 — Cold Outreach последователност

**Имейл #1 (Ден 1) — Pain-focused:**
> "Здравейте, занимавам се с инструмент за автоматично извличане на данни от фактури за туристически агенции по маржов метод. Много агенции губят по 2-3 часа седмично на ръчно въвеждане. Имате ли тази болка? Мога да покажа демо за 15 минути."

**Имейл #2 (Ден 5) — Social proof:**
> "Исках да последвам — инструментът автоматично чете PDF фактури и попълва протоколите по ЗДДС. Имате ли 15 минути тази седмица?"

**Имейл #3 (Ден 12) — Last try:**
> "Последен път се свързвам. Ако ръчното въвеждане не е проблем — напълно разбирам. Ако се промени — линкът за демо е тук."

### Фаза 4 — Demo структура (15 мин)
1. Мин 1-3: "Как сега обработвате фактурите?" (discovery)
2. Мин 3-10: Live demo — PDF → Mistral → попълнен протокол
3. Мин 10-13: "Това би ли ви спестило време?" (confirmation)
4. Мин 13-15: Pricing + следваща стъпка

### Фаза 5 — Конверсия

| Тип | Подход | Target конверсия |
|-----|--------|-----------------|
| Малка агенция | Self-serve trial след имейл #1 | 5-10% |
| Средна агенция | Demo call → trial → плащане | 20-30% след демо |

**Pricing (работна хипотеза):**
- Basic: 49 лв/месец — до 50 фактури/месец, 1 потребител
- Pro: 99 лв/месец — неограничени фактури, до 3 потребители

Винаги предлагай 2 плана — никога само 1. Числата са начална хипотеза, коригирай след първите 5 демота.

**Имейл outreach:** изпраща се ръчно от Gmail. Имейл адресите се намират на уебсайта на агенцията (Contact страница). Google Maps рядко показва имейл.

**Self-serve trial:** зависи от наличието на trial flow в продукта. Докато не е готов — всички конверсии минават през Demo call. Малките агенции получават trial линк само след като trial flow е имплементиран.

### Daily CRM Routine (20 мин/ден)
1. Отвори "Follow-up днес" view
2. Контактувай → смени Статус → постави нова Follow-up дата
3. Веднъж седмично: Apify за нови агенции → добави в Notion

---

## Implementation Steps

1. Настрой Notion Integration Token (notion.so/my-integrations)
2. Настрой Apify API Key (console.apify.com)
3. Добави двата MCP сървъра в `~/.claude/settings.json`
4. Създай Notion база данни с горната структура
5. Сподели базата с Notion Integration
6. Тествай: "Намери туристически агенции в София" → Notion
7. Стартирай outreach по шаблоните
