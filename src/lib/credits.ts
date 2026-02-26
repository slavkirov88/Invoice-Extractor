import { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "slavkirov@abv.bg";

export interface UserCredits {
  plan: "free" | "professional" | "business";
  planName: string;
  used: number;
  total: number;
  remaining: number;
  isUnlimited: boolean;
  hasSubscription: boolean;
}

export async function getUserCredits(
  supabase: SupabaseClient,
  userId: string,
  email?: string
): Promise<UserCredits> {
  // Admin always has unlimited access
  if (email === ADMIN_EMAIL) {
    return {
      plan: "business",
      planName: "Админ",
      used: 0,
      total: Infinity,
      remaining: Infinity,
      isUnlimited: true,
      hasSubscription: true,
    };
  }

  // Check whitelist by email (beta testers — added before registration)
  if (email) {
    const { data: whitelist } = await supabase
      .from("whitelisted_emails")
      .select("plan, expires_at")
      .eq("email", email.toLowerCase())
      .single();

    if (whitelist) {
      // Check expiration
      if (whitelist.expires_at && new Date(whitelist.expires_at) < new Date()) {
        // Expired whitelist — fall through to subscription/free check
      } else {
        const plan = (whitelist.plan || "professional") as "professional" | "business";
        return {
          plan,
          planName: plan === "professional" ? "Професионален" : "Бизнес",
          used: 0,
          total: Infinity,
          remaining: Infinity,
          isUnlimited: true,
          hasSubscription: true,
        };
      }
    }
  }

  // Check subscription (Stripe or admin-granted)
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan, stripe_subscription_id, current_period_end")
    .eq("user_id", userId)
    .single();

  const hasActiveSub =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing");

  if (hasActiveSub) {
    // For admin-granted subs without Stripe, check expiration
    const isWhitelist = !subscription.stripe_subscription_id;
    if (isWhitelist && subscription.current_period_end) {
      if (new Date(subscription.current_period_end) < new Date()) {
        return {
          plan: "free",
          planName: "Безплатен",
          used: 0,
          total: 0,
          remaining: 0,
          isUnlimited: false,
          hasSubscription: false,
        };
      }
    }

    const plan = subscription.plan as "professional" | "business";
    return {
      plan,
      planName: plan === "professional" ? "Професионален" : "Бизнес",
      used: 0,
      total: Infinity,
      remaining: Infinity,
      isUnlimited: true,
      hasSubscription: true,
    };
  }

  // Free plan — no credits, must start trial
  return {
    plan: "free",
    planName: "Безплатен",
    used: 0,
    total: 0,
    remaining: 0,
    isUnlimited: false,
    hasSubscription: false,
  };
}
