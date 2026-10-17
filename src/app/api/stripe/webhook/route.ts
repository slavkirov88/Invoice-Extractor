import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function getAdminClient() {
  return createClient(
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
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    // Signature verification is pure crypto — no network call
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        // Use direct fetch instead of SDK to avoid connectivity issues
        const sub = await stripeGet(`/subscriptions/${session.subscription}`);
        const priceId = sub.items?.data?.[0]?.price?.id ?? "";
        const plan = getPlan(priceId);

        const { error } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          status: "trialing",
          plan,
          current_period_end: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
        if (error) console.error("checkout.session.completed upsert error:", error);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const priceId = subscription.items.data[0]?.price?.id ?? "";
        const plan = getPlan(priceId);
        // Customer portal schedules cancellation via cancel_at (cancel_at_period_end stays false)
        const isCanceling = subscription.cancel_at_period_end || subscription.cancel_at != null;
        const status = isCanceling ? "canceling" : subscription.status;
        // API versions since 2025-03-31 (basil) moved the period to the subscription item
        const periodEnd =
          (subscription.items.data[0] as { current_period_end?: number } | undefined)
            ?.current_period_end ?? subscription.current_period_end;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status,
            plan,
            ...(periodEnd
              ? { current_period_end: new Date(periodEnd * 1000).toISOString() }
              : {}),
          })
          .eq("user_id", userId);
        if (error) console.error("customer.subscription.updated error:", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("user_id", userId);
        if (error) console.error("customer.subscription.deleted error:", error);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription;
      if (subscriptionId) {
        const sub = await stripeGet(`/subscriptions/${subscriptionId}`);
        const userId = sub.metadata?.userId;
        if (userId) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", userId);
          if (error) console.error("invoice.payment_failed update error:", error);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
