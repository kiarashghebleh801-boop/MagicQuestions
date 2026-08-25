import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lrrlwilhbubyjwiyytsj.supabase.co";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !webhookSecret || !serviceRole) return new NextResponse("Missing server configuration",{status:500});

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing Stripe signature",{status:400});

  const stripe = new Stripe(secret);
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody,signature,webhookSecret);
  } catch (error) {
    return new NextResponse(`Webhook signature error: ${error instanceof Error ? error.message : "invalid"}`,{status:400});
  }

  const supabase = createClient(SUPABASE_URL,serviceRole,{auth:{persistSession:false}});

  async function syncSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.user_id;
    if (!userId) return;
    const plan = subscription.metadata.plan === "yearly" ? "yearly" : "monthly";
    const statusMap: Record<string,"active"|"past_due"|"cancelled"|"inactive"> = {
      active:"active",trialing:"active",past_due:"past_due",unpaid:"past_due",canceled:"cancelled",incomplete:"inactive",incomplete_expired:"inactive",paused:"inactive"
    };
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    await supabase.from("memberships").upsert({
      user_id:userId,
      plan,
      status:statusMap[subscription.status] || "inactive",
      source:"stripe",
      stripe_customer_id:typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      stripe_subscription_id:subscription.id,
      current_period_end:currentPeriodEnd ? new Date(currentPeriodEnd*1000).toISOString() : null,
      updated_at:new Date().toISOString(),
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (typeof session.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      await syncSubscription(subscription);
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({received:true});
}
