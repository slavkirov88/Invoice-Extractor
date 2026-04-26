import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    const params = new URLSearchParams({
      mode: "subscription",
      "payment_method_types[]": "card",
      "line_items[0][price]": priceId.trim(),
      "line_items[0][quantity]": "1",
      "subscription_data[trial_period_days]": "14",
      "subscription_data[trial_settings][end_behavior][missing_payment_method]": "cancel",
      "subscription_data[metadata][userId]": user.id,
      payment_method_collection: "always",
      customer_email: user.email!,
      "metadata[userId]": user.id,
      success_url: `${origin}/overview?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/#pricing`,
      allow_promotion_codes: "true",
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Stripe API error:", data);
      return NextResponse.json(
        { error: "Failed to create checkout session", detail: data?.error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: message },
      { status: 500 }
    );
  }
}
