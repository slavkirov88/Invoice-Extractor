"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Upload,
  Zap,
  Shield,
  Clock,
  FileSpreadsheet,
  Bot,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  ChevronDown,
  Menu,
  X,
  Lock,
  Globe,
  Sparkles,
  Calculator,
  FileText,
  Download,
  CreditCard,
  BadgeCheck,
  TrendingDown,
  Mail,
} from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { AnimatedCounter } from "./AnimatedCounter";
import { ChatBot } from "./ChatBot";

const rotatingWords = [
  "по-бързо",
  "по-точно",
  "по-евтино",
  "без усилие",
];

function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-10 bg-gradient-to-r from-violet-700 via-violet-600 to-violet-700 flex items-center justify-center px-4">
      <p className="text-xs sm:text-sm text-white font-medium text-center leading-none">
        <span className="mr-1.5">🎯</span>
        Специализирано за{" "}
        <span className="font-bold">туристически агенции</span> и техните счетоводители
        <a
          href="#pricing"
          className="ml-3 inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:text-violet-200 transition-colors"
        >
          Пробвай 7 дни безплатно →
        </a>
      </p>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Функции", href: "#features" },
    { label: "Как работи", href: "#how-it-works" },
    { label: "Цени", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav
      className={`fixed top-10 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? "bg-background backdrop-blur-xl border-b border-border shadow-lg"
          : "bg-background backdrop-blur-xl border-b border-border shadow-lg md:bg-transparent md:backdrop-blur-none md:border-b-0 md:shadow-none"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">TravelInvoices</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Вход
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25"
            >
              Започни безплатно
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden bg-background"
            >
              <div className="py-4 space-y-3">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="px-4 pt-2 space-y-2">
                  <Link
                    href="/login"
                    className="block w-full text-center rounded-lg border border-border px-4 py-2.5 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Вход
                  </Link>
                  <a
                    href="#pricing"
                    className="block w-full text-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Започни безплатно
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[104px]">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(124,58,237,0.08),transparent_50%)]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-400/10 rounded-full blur-[128px] animate-pulse" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-8"
        >
          <Sparkles className="h-4 w-4" />
          <span>Единственият инструмент, построен специално за туроператори по ЗДДС маржов метод</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-6"
        >
          Автоматизирай фактурирането
          <br />
          на твоята туристическа агенция{" "}
          <span className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600"
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-violet-600" />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground mb-10 px-2 sm:px-0"
        >
          AI-базиран инструмент, създаден специално за туристически агенции.
          Качвате PDF фактура — ние извличаме данните и генерираме протоколи по{" "}
          <span className="text-foreground font-medium">ЗДДС маржов метод</span>{" "}
          за секунди.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Link
            href="#pricing"
            className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-white hover:bg-violet-700 transition-all shadow-2xl shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.02]"
          >
            Започни 7-дневен безплатен тест
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-medium hover:bg-accent transition-colors"
          >
            <Play className="h-5 w-5 text-violet-400" />
            Виж демо
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            7 дни безплатно — без карта
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-500" />
            30 дни гаранция за парите
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            От 20€/месец след теста
          </span>
        </motion.div>

        {/* Hero image / app preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl shadow-violet-500/5">
            <div className="rounded-lg bg-card overflow-hidden">
              {/* Simulated app screenshot */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                    app.travelinvoices.com
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="h-5 sm:h-6 w-32 sm:w-48 bg-foreground/10 rounded animate-pulse" />
                    <div className="h-3 sm:h-4 w-24 sm:w-32 bg-foreground/5 rounded mt-2" />
                  </div>
                  <div className="h-8 sm:h-10 w-28 sm:w-36 bg-violet-600/20 rounded-lg flex items-center justify-center text-[10px] sm:text-xs text-violet-400 shrink-0">
                    + Добави фактура
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { label: "Протоколи", value: "24" },
                    { label: "Фактури", value: "156" },
                    { label: "Получени", value: "45,200 €" },
                    { label: "Платени", value: "38,100 €" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-background/50 border border-border/50 p-2 sm:p-3"
                    >
                      <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
                      <div className="text-sm sm:text-lg font-bold mt-0.5 sm:mt-1">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block rounded-lg border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-5 gap-0 text-xs">
                    <div className="px-3 py-2 bg-muted/30 font-medium">№</div>
                    <div className="px-3 py-2 bg-muted/30 font-medium">Доставчик</div>
                    <div className="px-3 py-2 bg-muted/30 font-medium">Дата</div>
                    <div className="px-3 py-2 bg-muted/30 font-medium">Сума</div>
                    <div className="px-3 py-2 bg-muted/30 font-medium">Тип</div>
                    {[
                      ["001", "Хотел Парадайз", "15.02.2026", "2,400 €", "Стандартен"],
                      ["002", "Транс Лукс ООД", "18.02.2026", "1,850 €", "Стандартен"],
                      ["003", "Ski Tours BG", "20.02.2026", "3,200 €", "Комисионен"],
                    ].map((row, i) =>
                      row.map((cell, j) => (
                        <div
                          key={`${i}-${j}`}
                          className={`px-3 py-2.5 ${i < 2 ? "border-b border-border/30" : ""}`}
                        >
                          {cell}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className="py-16 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <ScrollReveal delay={0}>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-violet-400">
                <AnimatedCounter end={20} suffix="+" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                часа спестени месечно
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-violet-400">
                <AnimatedCounter end={99} suffix="%" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                точност на AI извличане
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-violet-400">
                <AnimatedCounter end={30} suffix=" сек" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                от PDF до протокол
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-violet-400">
                ЗДДС
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                съобразен с маржов метод
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: Clock,
      title: "15–30 часа на месец",
      desc: "толкова губите за ръчно въвеждане на фактури и съставяне на протоколи",
    },
    {
      icon: TrendingDown,
      title: "Чести грешки",
      desc: "ръчното изчисление на маржа и ДДС води до грешки и ревизии от НАП",
    },
    {
      icon: FileText,
      title: "Хаос от документи",
      desc: "Фактури по имейли, Excel таблици, хартиени документи — разпилени навсякъде и трудно за проследяване",
    },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Познато ли ви е?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Повечето туристически агенции все още управляват фактурите си ръчно.
              Резултатът — загубено време, грешки и стрес при данъчни проверки.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div className="group relative rounded-xl border border-red-500/20 bg-red-500/5 p-6 hover:border-red-500/40 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 mb-4">
                  <problem.icon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Bot,
      title: "AI извличане на данни",
      desc: "Специализираният ни софтуер автоматично разчита PDF фактурите ви — номер, дата, сума. Без ръчно въвеждане.",
      gradient: "from-violet-600 to-indigo-600",
    },
    {
      icon: Calculator,
      title: "Автоматични ДДС изчисления",
      desc: "Маржът, данъчната основа и ДДС се изчисляват автоматично по ЗДДС маржов метод. Раздел В — готов.",
      gradient: "from-indigo-600 to-cyan-600",
    },
    {
      icon: FileSpreadsheet,
      title: "Експорт в Excel и PDF",
      desc: "Изтеглете протоколите си в Excel или PDF с едно кликване. Готови за предаване на счетоводител или НАП.",
      gradient: "from-cyan-600 to-emerald-600",
    },
    {
      icon: Upload,
      title: "Drag & Drop качване",
      desc: "Просто плъзнете PDF файла в браузъра. Без сложни настройки, без инсталации.",
      gradient: "from-emerald-600 to-green-600",
    },
    {
      icon: Shield,
      title: "Сигурност на данните",
      desc: "Данните ви са криптирани и съхранявани в ЕС. GDPR съвместимост. Всеки потребител вижда само своите данни.",
      gradient: "from-green-600 to-teal-600",
    },
    {
      icon: Zap,
      title: "Бързодействие",
      desc: "От качване на PDF до готов протокол — под 30 секунди. Обработете стотици фактури за минути.",
      gradient: "from-teal-600 to-violet-600",
    },
    {
      icon: Mail,
      title: "Имейл интеграция",
      desc: "Свържете Gmail, Abv.bg, Outlook и др. — системата автоматично открива фактури в прикачените файлове и ги организира по контрагент и месец. Край на ръчното изтегляне.",
      gradient: "from-violet-600 to-pink-600",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-4">
              Функции
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Софтуер за фактури и протоколи за туроператори
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Единственият инструмент, който комбинира AI извличане от PDF фактури с
              автоматично генериране на протоколи по ЗДДС маржов метод.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="group relative rounded-xl border border-border bg-card p-6 hover:border-violet-500/50 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: Upload,
      title: "Качете PDF фактура",
      desc: "Drag & drop или изберете файл. Поддържаме всякакви PDF фактури от български и чуждестранни доставчици.",
    },
    {
      step: "02",
      icon: Bot,
      title: "AI извлича данните",
      desc: "Нашият софтуер автоматично разпознава номера на документа, датата и стойността от фактурата.",
    },
    {
      step: "03",
      icon: FileText,
      title: "Изберете протокол и тип",
      desc: "Посочете в кой протокол да влезе фактурата и дали е приходна (Раздел А), разходна (Раздел Б) или комисионна.",
    },
    {
      step: "04",
      icon: Download,
      title: "Изтеглете протокола",
      desc: "Раздел В с маржа и ДДС се калкулира автоматично. Експортирайте в Excel или PDF.",
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-4">
              Как работи
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              От PDF фактура до протокол за марж за 30 секунди
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Четири прости стъпки заменят часове ръчна работа.
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.15}>
                <div className="text-center group">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/30 mb-6 group-hover:bg-violet-600/20 transition-colors">
                    <step.icon className="h-7 w-7 text-violet-400" />
                    <div className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section id="demo" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Вижте как работи на практика
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              3-минутно демо, което показва целия процес — от качване на фактура
              до готов протокол.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="relative mx-auto max-w-4xl">
            <div className="relative aspect-video rounded-2xl border border-border overflow-hidden shadow-2xl">
              <iframe
                src="https://www.loom.com/embed/2419bf8326504af29fea0de0d0a92197?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-violet-600/10 rounded-3xl blur-2xl -z-10" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Преди и след TravelInvoices
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ScrollReveal direction="left">
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 sm:p-8">
              <div className="flex items-center gap-2 text-red-400 font-semibold mb-4 sm:mb-6">
                <X className="h-5 w-5" />
                Без TravelInvoices
              </div>
              <ul className="space-y-4">
                {[
                  "Ръчно въвеждане от всяка фактура",
                  "Изчисления с калкулатор в Excel",
                  "15–30 часа месечно за протоколи",
                  "Грешки при маржовия метод",
                  "Стрес при данъчни проверки",
                  "Фактури по имейли — търсите ги с часове",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <X className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-8">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-4 sm:mb-6">
                <CheckCircle2 className="h-5 w-5" />
                С TravelInvoices
              </div>
              <ul className="space-y-4">
                {[
                  "AI извлича данните автоматично",
                  "ДДС и марж — изчислени мигновено",
                  "Под 1 час за всичко — месечно",
                  "99% точност без човешки грешки",
                  "Винаги готови за НАП проверка",
                  "Фактурите от имейли — синхронизирани автоматично",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Старт",
      originalPrice: "33",
      price: "20",
      savings: "−40%",
      period: "/месец",
      description: "До 200 фактури и 50 протокола месечно.",
      trial: "7 дни безплатно",
      features: [
        "До 200 фактури/месец",
        "До 50 протокола/месец",
        "AI извличане на данни от PDF",
        "Автоматичен марж и ДДС — Раздел А, Б, В",
        "Експорт в Excel и PDF — готово за счетоводителя",
        "Имейл интеграция — фактурите наредени по контрагент и месец",
      ],
      cta: "Започни безплатен тест",
      popular: true,
      gradient: true,
    },
    {
      name: "Бизнес",
      originalPrice: "80",
      price: "40",
      savings: "−50%",
      period: "/месец",
      description: "Неограничен обем — без тавани, без компромиси.",
      trial: "7 дни безплатно",
      features: [
        "Неограничени фактури",
        "Неограничени протоколи",
        "AI извличане на данни от PDF",
        "Автоматичен марж и ДДС — Раздел А, Б, В",
        "Експорт в Excel и PDF — готово за счетоводителя",
        "Имейл интеграция — фактурите наредени по контрагент и месец",
      ],
      cta: "Започни безплатен тест",
      popular: false,
      gradient: false,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-4">
              Цени
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Спести 10+ часа всеки месец
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              За по-малко от чаша кафе на ден — нулева ръчна работа по ДДС протоколите.
              7 дни безплатно, без плащане. И ако след 30 дни не те впечатли — връщаме парите без въпроси.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <ScrollReveal key={i} delay={i * 0.15}>
              <div
                className={`relative rounded-2xl p-5 sm:p-8 h-full flex flex-col ${
                  plan.popular
                    ? "border-2 border-violet-500 bg-card shadow-xl shadow-violet-500/10"
                    : "border border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-4 py-1 text-xs font-semibold text-white">
                      <Star className="h-3 w-3" />
                      Най-популярен
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}€/мес</span>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">{plan.savings}</span>
                  </div>
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-lg text-muted-foreground ml-1">
                    €{plan.period}
                  </span>
                </div>

                <div className="mb-8">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {plan.trial}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="/login"
                  className={`block w-full rounded-xl py-3 text-sm font-semibold text-center transition-all ${
                    plan.popular
                      ? "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-600/25"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                </a>
                <p className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-emerald-500 shrink-0" />
                  30 дни гаранция — връщаме парите без въпроси
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust elements under pricing */}
        <ScrollReveal>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Сигурно плащане чрез Stripe
            </span>
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              30 дни гаранция за връщане
            </span>
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" />
              Откажете се по всяко време
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Какво включва безплатният тестов период?",
      a: "Получавате пълен достъп до всички функции за 7 дни. Въвеждате картата си при регистрация, но не ви таксуваме през първите 7 дни. Ако решите да не продължавате — откажете се с 1 клик от настройките на акаунта. Ако не направите нищо, абонаментът продължава автоматично.",
    },
    {
      q: "Как се извличат данните от фактурите?",
      a: "Качвате PDF файл и нашият специализиран софтуер автоматично разпознава номера на документа, датата на издаване и общата стойност. Можете да прегледате и коригирате данните преди записване.",
    },
    {
      q: "Поддържате ли маржовия метод по ЗДДС?",
      a: "Да! TravelInvoices е създаден специално за туристически агенции, работещи по маржовия метод (чл. 136–141 ЗДДС). Автоматично генерирани протоколи с Раздел А (получени суми), Раздел Б (платени суми) и Раздел В (ДДС калкулации).",
    },
    {
      q: "Сигурни ли са данните ми?",
      a: "Абсолютно. Данните се съхраняват криптирано в ЕС дата центрове (Supabase/PostgreSQL). Всеки потребител има достъп само до собствените си данни чрез Row Level Security. Спазваме GDPR.",
    },
    {
      q: "Мога ли да се откажа по всяко време?",
      a: "Да. Няма дългосрочни договори. От настройките на акаунта натискате \"Управлявай абонамент\" и се отказвате с 1 клик. Данните ви остават достъпни до края на платения период.",
    },
    {
      q: "В какви формати мога да експортирам?",
      a: "Поддържаме експорт в Excel (.xlsx) и PDF. Форматът следва стандартната бланка за протокол по ЗДДС маржов метод.",
    },
    {
      q: "Работи ли с фактури на чужди езици?",
      a: "Да, системата ни поддържа множество езици. Можете да качвате фактури от международни доставчици — хотели, транспортни компании и т.н.",
    },
    {
      q: "Какви видове протоколи поддържате?",
      a: "Поддържаме три вида протоколи: 'в ЕС' (ДДС 20%), 'извън ЕС' (ДДС 0%) и 'Смесен' (за услуги едновременно в и извън ЕС, с ДДС ставка за всяка фактура поотделно). Всички са съобразени с маржовия метод по чл. 136–141 ЗДДС.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300 mb-4">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Често задавани въпроси
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-muted-foreground">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative px-5 py-12 sm:px-16 sm:py-24 text-center">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Готови ли сте да спестявате
                <br />
                време и нерви?
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
                Присъединете се към туристическите агенции, които вече управляват
                фактурите си автоматично. Тествайте 7 дни безплатно.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold text-violet-700 hover:bg-white/90 transition-all shadow-2xl hover:scale-[1.02]"
                >
                  Започни 7-дневен безплатен тест
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/60">
                7 дни безплатно &middot; Откажете се по всяко време &middot; После от 20€/мес
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">TravelInvoices</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              AI-базиран инструмент за управление на фактури и протоколи по ЗДДС
              маржов метод. Създаден за туристически агенции в България.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                EU дата центрове
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                GDPR
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                SSL
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Продукт</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Функции
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Цени
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-foreground transition-colors">
                  Демо
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Правни</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Условия за ползване
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Политика за поверителност
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-foreground transition-colors">
                  Бисквитки
                </Link>
              </li>
            </ul>

            <h4 className="font-semibold mb-3 mt-6 text-sm">Контакти</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="mailto:support@travelinvoices.com" className="hover:text-foreground transition-colors">
                  support@travelinvoices.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>&copy; 2026 TravelInvoices. Всички права запазени.</span>
          <span>Сигурна платформа с EU хостинг</span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <VideoSection />
      <BeforeAfterSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <ChatBot />
    </div>
  );
}
