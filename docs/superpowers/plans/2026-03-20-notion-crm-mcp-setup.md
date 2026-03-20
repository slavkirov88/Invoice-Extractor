# Notion CRM + MCP Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Настрой Notion MCP + Apify MCP в Claude Code, създай Notion CRM база данни за туристически агенции в България, направи първи scraping, и стартирай outreach процеса.

**Architecture:** Claude Code с два MCP сървъра (Notion + Apify) действа като sales assistant — natural language команди → Apify събира данни от Google Maps → Notion получава структурирани записи → founder управлява pipeline от Notion.

**Tech Stack:** Claude Code MCP, `@notionhq/notion-mcp-server`, `apify-mcp-server`, Notion API, Apify Google Maps Scraper (`compass/google-maps-scraper`)

---

## Scope

Планът има 2 независими подсистеми:
1. **MCP Setup** (Tasks 1-3) — техническа конфигурация, само веднъж
2. **CRM + Outreach** (Tasks 4-6) — операционален, повтарящ се процес

---

## Task 1: Вземи API ключове

**Файлове:** Няма — само акаунти и ключове.

- [ ] **Стъпка 1: Notion Integration Token**
  1. Отвори [notion.so/my-integrations](https://www.notion.so/my-integrations)
  2. Кликни "New integration"
  3. Попълни: Name = "Invoice Extractor CRM", избери своя workspace
  4. Кликни "Submit"
  5. Копирай **Internal Integration Token** (започва с `secret_`)
  6. Запази го временно — ще го ползваш в Task 2

- [ ] **Стъпка 2: Apify API Key**
  1. Отвори [console.apify.com](https://console.apify.com)
  2. Регистрирай се ако нямаш акаунт (има безплатен tier)
  3. Горе вдясно → Account → Integrations → **API tokens**
  4. Копирай Default API Token (или създай нов)
  5. Запази го временно — ще го ползваш в Task 2

---

## Task 2: Конфигурирай MCP сървърите в Claude Code

**Файл:** `C:\Users\mariy\.claude\settings.json`

- [ ] **Стъпка 0: Провери Node.js**

  Отвори Command Prompt (Win+R → `cmd` → Enter) и напиши:
  ```
  node --version
  ```
  Ако получиш номер (напр. `v20.11.0`) — всичко е наред.
  Ако получиш грешка — инсталирай Node.js от [nodejs.org](https://nodejs.org) (LTS версията), след това рестартирай Command Prompt.

- [ ] **Стъпка 1: Отвори settings.json**

  ```bash
  code "C:\Users\mariy\.claude\settings.json"
  ```
  Ако `code` не работи — отвори файла с Notepad:
  Win+R → `notepad C:\Users\mariy\.claude\settings.json` → Enter.
  Ако файлът не съществува — създай го с `{}`.

- [ ] **Стъпка 2: Добави mcpServers блока**

  Намери или създай `mcpServers` ключа и добави:

  ```json
  {
    "mcpServers": {
      "notion": {
        "command": "npx",
        "args": ["-y", "@notionhq/notion-mcp-server"],
        "env": {
          "NOTION_API_KEY": "secret_ТВОЯ_ТОКЕН_ТУК"
        }
      },
      "apify": {
        "command": "npx",
        "args": ["-y", "@apify/actors-mcp-server"],
        "env": {
          "APIFY_API_TOKEN": "ТВОЯ_APIFY_КЛЮЧ_ТУК"
        }
      }
    }
  }
  ```

  Замени `secret_ТВОЯ_ТОКЕН_ТУК` и `ТВОЯ_APIFY_КЛЮЧ_ТУК` с реалните стойности от Task 1.

  > **Ако файлът вече има съдържание:** Добави `mcpServers` блока вътре в съществуващите `{}` скоби, разделен от другите ключове със запетая. Пример:
  > ```json
  > {
  >   "theme": "dark",
  >   "mcpServers": { ... }
  > }
  > ```

  > **Notion Integration capabilities:** Когато създаваш интеграцията в Task 1, увери се, че "Insert content" е включено (по подразбиране е включено — просто провери).

- [ ] **Стъпка 3: Рестартирай Claude Code**

  Затвори и отвори отново Claude Code — MCP сървърите се зареждат само при старт.

- [ ] **Стъпка 4: Верифицирай MCP е активен**

  В нова Claude Code сесия напиши:
  ```
  List available MCP tools
  ```
  Трябва да видиш tools от `notion` и `apify` в списъка.

---

## Task 3: Създай Notion CRM базата данни

**Файлове:** Няма код — операции в Notion UI + Claude.

- [ ] **Стъпка 1: Създай нова Notion страница**
  1. В Notion → New page
  2. Заглавие: `Туристически Агенции БГ`
  3. Избери тип: **Database → Full page**

- [ ] **Стъпка 2: Добави колоните**

  Добави следните properties (в Notion UI — "+" бутонът до колоните):

  | Колона | Тип в Notion |
  |--------|-------------|
  | Агенция | Title (вече съществува) |
  | Град | Select |
  | Телефон | Phone |
  | Имейл | Email |
  | Уебсайт | URL |
  | Размер | Select |
  | Статус | Select |
  | Контактнат | Checkbox |
  | Демо изпратено | Checkbox |
  | Дата на контакт | Date |
  | Follow-up дата | Date |
  | Канал | Select |
  | Бележки | Text |
  | Рейтинг | Number |
  | Приоритет | Select |
  | Източник | Select |

- [ ] **Стъпка 3: Попълни Select опциите**

  - **Град:** София, Пловдив, Варна, Бургас, Друг
  - **Размер:** Малка, Средна
  - **Статус:** 🆕 Нов, 📞 Контактнат, 🎬 Демо изпратено, 🤝 Преговори, ✅ Клиент, ❌ Отказал
  - **Канал:** Имейл, Телефон, LinkedIn, Препоръка
  - **Приоритет:** 🔥 Висок, 🟡 Среден, ⬜ Нисък
  - **Източник:** Google Maps, Препоръка, Реклама

- [ ] **Стъпка 4: Създай Views**

  В горната лента на базата → "Add a view":
  1. **Kanban** → Group by: Статус → Наименувай "Pipeline"
  2. **Table** → Наименувай "Всички агенции"
  3. **Table** → Filter: Follow-up дата = Today → Наименувай "Follow-up днес"
  4. **Table** → Filter: Контактнат = Unchecked → Наименувай "Неконтактвани"

- [ ] **Стъпка 5: Свържи базата с Notion Integration**
  1. Отвори базата данни
  2. Горе вдясно → `...` (три точки) → **Connections**
  3. Намери "Invoice Extractor CRM" → кликни **Connect**

- [ ] **Стъпка 6: Копирай Database ID**

  URL на базата изглежда така:
  ```
  https://www.notion.so/WORKSPACE/DATABASE_ID?v=VIEW_ID
  ```
  Копирай `DATABASE_ID` (32 символа между последното `/` и `?`) — ще го ползваш в Task 4.

---

## Task 4: Първи Apify Scraping → Notion

**Файлове:** Няма код — команди в Claude Code с MCP.

- [ ] **Стъпка 1: Тествай Apify MCP с малко търсене**

  В Claude Code напиши:
  ```
  Using Apify, run the compass/google-maps-scraper actor with search query
  "туристически агенции София" and maxItems 10. Return the results.
  ```
  Очаквай: списък от ~10 агенции с имена, адреси, телефони, уебсайти, рейтинги.

- [ ] **Стъпка 2: Тествай Notion MCP запис**

  Замени `[DATABASE_ID]` с ID-то, което копира в Task 3, Стъпка 6.

  В Claude Code напиши:
  ```
  Using Notion, add a test record to database [DATABASE_ID] with:
  - Агенция: "Тест Агенция"
  - Град: София
  - Статус: 🆕 Нов
  ```
  Провери в Notion UI — записът трябва да се появи.

- [ ] **Стъпка 3: Пълен scraping — София**

  > Замени `[DATABASE_ID]` с ID-то от Task 3, Стъпка 6 навсякъде по-долу.

  ```
  Using Apify compass/google-maps-scraper, search for "туристически агенции София"
  with maxItems 100. For each result, create a record in Notion database [DATABASE_ID] with:
  - Агенция: name
  - Град: София
  - Телефон: phone
  - Уебсайт: website
  - Рейтинг: rating
  - Статус: 🆕 Нов
  - Източник: Google Maps
  - Приоритет: 🔥 Висок if (website exists AND rating >= 4.0 AND reviewsCount >= 20), else ⬜ Нисък
  Skip duplicates (check if Агенция name already exists).
  ```

- [ ] **Стъпка 4: Повтори за останалите градове**

  Изпълни същата команда за:
  - "туристически агенции Пловдив"
  - "туристически агенции Варна"
  - "туристически агенции Бургас"
  - "travel agency Bulgaria" (за агенции извън големите градове)

- [ ] **Стъпка 5: Верифицирай базата**

  В Notion отвори "Всички агенции" view — трябва да има 200+ записа.
  Провери "Pipeline" Kanban — всички трябва да са в колона "🆕 Нов".

---

## Task 5: Enrichment — намери имейли

**Файлове:** Няма код — ръчен процес, 20-30 мин/ден.

- [ ] **Стъпка 1: Филтрирай Висок приоритет**

  В Notion → "Неконтактвани" view → сортирай по Приоритет (🔥 Висок първо).

- [ ] **Стъпка 2: За всяка агенция с уебсайт — намери имейл**

  1. Отвори уебсайта на агенцията
  2. Намери страница "Контакти" / "За нас"
  3. Копирай имейл адреса в Notion полето "Имейл"

  Целта: 20-30 имейла на ден докато достигнеш 100+ с имейл.

- [ ] **Стъпка 3: Задай Размер ръчно**

  Докато намираш имейли — погледни уебсайта и постави:
  - **Малка** ако изглежда 1-5 човека (малък сайт, 1 офис)
  - **Средна** ако изглежда 5-20 човека (повече услуги, екип страница)

---

## Task 6: Стартирай Cold Outreach

**Файлове:** Имейл шаблони (само референция по-долу).

- [ ] **Стъпка 1: Подготви Gmail**

  В Gmail → Settings → Templates → Enable.
  Създай 3 шаблона:

  **Шаблон 1 — Pain-focused:**
  ```
  Subject: Автоматизация на фактури по маржов метод

  Здравейте,

  Занимавам се с инструмент за автоматично извличане на данни от фактури
  за туристически агенции по ЗДДС маржов метод. Много агенции губят по
  2-3 часа седмично на ръчно въвеждане в протоколите.

  Имате ли тази болка? Мога да покажа демо за 15 минути тази седмица.

  Поздрави,
  [Име]
  ```

  **Шаблон 2 — Follow-up:**
  ```
  Subject: Re: Автоматизация на фактури по маржов метод

  Здравейте,

  Исках да последвам предишния си имейл. Инструментът автоматично чете
  PDF фактури и попълва протоколите по ЗДДС — без ръчно въвеждане.

  Имате ли 15 минути тази седмица за кратко демо?

  Поздрави,
  [Име]
  ```

  **Шаблон 3 — Last try:**
  ```
  Subject: Re: Автоматизация на фактури по маржов метод

  Здравейте,

  Последен път се свързвам по тази тема. Ако ръчното въвеждане на
  фактури не е проблем за вас — напълно разбирам.

  Ако се промени в бъдеще, с удоволствие ще покажа демо.

  Поздрави,
  [Име]
  ```

- [ ] **Стъпка 2: Изпрати първите 10 имейла (пилот)**

  - Избери 10 агенции с 🔥 Висок приоритет и имейл
  - Изпрати Шаблон 1 на всяка
  - В Notion: смени Статус → 📞 Контактнат, постави Контактнат ✓, Дата на контакт = днес, Follow-up дата = днес + 5

- [ ] **Стъпка 3: Настрой daily routine**

  Всеки ден (20 мин):
  1. Notion → "Follow-up днес" view
  2. Изпрати следващия имейл в последователността (Шаблон 2 или 3)
  3. Обнови Статус + нова Follow-up дата
  4. Ако отговорят → смени Статус на 🎬 Демо изпратено или 🤝 Преговори

- [ ] **Стъпка 4: Scale — 10 имейла/ден**

  След пилота → увеличи до 10 нови агенции на ден.
  Веднъж седмично: нов Apify scraping за нови агенции.

---

## Demo Script (Reference)

При записан demo call — следвай тази структура:

| Мин | Действие |
|-----|----------|
| 1-3 | "Как сега обработвате фактурите? Колко време отнема?" |
| 3-10 | Live demo: качи PDF → Mistral извлича → протокол попълнен |
| 10-13 | "Това би ли ви спестило [X] часа?" |
| 13-15 | Basic: 49 лв/м или Pro: 99 лв/м. "Искате ли да пробвате?" |

---

## Success Criteria

- [ ] Week 1: 200+ агенции в Notion базата
- [ ] Week 2: 50+ с имейл адрес, 10 изпратени имейла
- [ ] Week 3: Поне 2 demo calls записани
- [ ] Month 1: Поне 1 плащащ клиент или 5 активни trial-а
