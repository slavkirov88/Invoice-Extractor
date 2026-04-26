import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

function getPlan(priceId: string): "professional" | "business" {
  const businessId = (process.env.STRIPE_BUSINESS_PRICE_ID ?? "").trim();
  return priceId.trim() === businessId ? "business" : "professional";
}

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Fetch the checkout session from Stripe
    const session = await stripeGet(`/checkout/sessions/${sessionId}`);

    if (session.error) {
      return NextResponse.json(
        { error: "Invalid session", detail: session.error.message },
        { status: 400 }
      );
    }

    // Verify this session belongs to the current user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
    }

    if (!session.subscription) {
      return NextResponse.json({ error: "No subscription in session" }, { status: 400 });
    }

    // Fetch subscription details to get the price/plan
    const sub = await stripeGet(`/subscriptions/${session.subscription}`);
    const priceId = sub.items?.data?.[0]?.price?.id ?? "";
    const plan = getPlan(priceId);
    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Write to Supabase immediately using admin client
    const adminSupabase = getAdminSupabase();
    const { error } = await adminSupabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      status: sub.status || "trialing",
      plan,
      current_period_end: periodEnd,
    });

    if (error) {
      console.error("Activate subscription error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      activated: true,
      plan,
      status: sub.status || "trialing",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Activate error:", message);
    return NextResponse.json(
      { error: "Activation failed", detail: message },
      { status: 500 }
    );
  }
}
