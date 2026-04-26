import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 30000,
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
