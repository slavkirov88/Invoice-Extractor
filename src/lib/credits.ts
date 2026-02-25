import { SupabaseClient } from "@supabase/supabase-js";

const FREE_PROTOCOL_LIMIT = 10;

export interface UserCredits {
  plan: "free" | "professional" | "business";
  planName: string;
  used: number;
  total: number;
  remaining: number;
  isUnlimited: boolean;
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
    };
  }

  // Free plan — count protocols
  const { count } = await supabase
    .from("protocols")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const used = count || 0;
  const remaining = Math.max(0, FREE_PROTOCOL_LIMIT - used);

  return {
    plan: "free",
    planName: "Безплатен",
    used,
    total: FREE_PROTOCOL_LIMIT,
    remaining,
    isUnlimited: false,
  };
}
