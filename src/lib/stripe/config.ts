import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export const PLANS = {
  free: {
    name: "Безплатен",
    priceId: null,
    limits: {
      protocols: 10,
      invoices: 20,
    },
    trialDays: 14,
  },
  professional: {
    name: "Старт",
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    limits: {
      protocols: Infinity,
      invoices: 500,
    },
    trialDays: 14,
  },
  business: {
    name: "Бизнес",
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    limits: {
      protocols: Infinity,
      invoices: Infinity,
    },
    trialDays: 14,
  },
} as const;
