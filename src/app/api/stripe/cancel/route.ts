import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cancel } = await request.json();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: cancel,
    });

    const newStatus = cancel ? "canceling" : "active";
    await supabase
      .from("subscriptions")
      .update({ status: newStatus })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
