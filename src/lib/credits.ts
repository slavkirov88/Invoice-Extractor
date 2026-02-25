import { SupabaseClient } from "@supabase/supabase-js";

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
  userId: string
): Promise<UserCredits> {
  // Check subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", userId)
    .single();

  const hasActiveSub =
    subscription &&
    (subscription.status === "active" || subscription.status === "trialing");

  if (hasActiveSub) {
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
