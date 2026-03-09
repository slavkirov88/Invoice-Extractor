import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/config";
import { createClient } from "@supabase/supabase-js";

// Use service role client for webhook (no user context)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event;

  try {
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
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        // Determine plan from the price
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = sub.items.data[0]?.price?.id;
        const plan =
          priceId === process.env.STRIPE_BUSINESS_PRICE_ID
            ? "business"
            : "professional";

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
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      if (userId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = (subscription as any).current_period_end as number;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan =
          priceId === process.env.STRIPE_BUSINESS_PRICE_ID
            ? "business"
            : "professional";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cancelAtPeriodEnd = (subscription as any).cancel_at_period_end as boolean;
        const status = cancelAtPeriodEnd ? "canceling" : subscription.status;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status,
            plan,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
          })
          .eq("user_id", userId);
        if (error) console.error("customer.subscription.updated error:", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
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
      const invoice = event.data.object;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = (invoice as any).subscription as string | undefined;
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;
          if (userId) {
            const { error } = await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("user_id", userId);
            if (error) console.error("invoice.payment_failed update error:", error);
          } else {
            console.error("invoice.payment_failed: no userId in subscription metadata", subscriptionId);
          }
        } catch (err) {
          console.error("invoice.payment_failed: failed to retrieve subscription", subscriptionId, err);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
