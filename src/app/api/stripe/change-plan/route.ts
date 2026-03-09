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

    const { priceId } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 404 });
    }

    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;

    if (!itemId) {
      return NextResponse.json({ error: "Subscription item not found" }, { status: 404 });
    }

    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change plan error:", error);
    return NextResponse.json({ error: "Failed to change plan" }, { status: 500 });
  }
}
