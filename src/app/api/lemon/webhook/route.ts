import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lrrlwilhbubyjwiyytsj.supabase.co";

type LemonSubscriptionAttributes = {
  customer_id?: number | string;
  variant_id?: number | string;
  status?: string;
  payment_processor?: string;
  renews_at?: string | null;
  ends_at?: string | null;
  user_email?: string | null;
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: LemonSubscriptionAttributes;
  };
};

function validSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!webhookSecret || !serviceRole) {
    return new NextResponse("Missing server configuration", { status: 500 });
  }

  const signature = request.headers.get("x-signature") || "";
  const rawBody = await request.text();
  if (!signature || !validSignature(rawBody, signature, webhookSecret)) {
    return new NextResponse("Invalid Lemon Squeezy signature", { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const eventName = payload.meta?.event_name || request.headers.get("x-event-name") || "";
  if (!eventName.startsWith("subscription_")) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const subscriptionId = payload.data?.id;
  const attributes = payload.data?.attributes;
  if (!subscriptionId || !attributes) return NextResponse.json({ received: true, ignored: true });

  const customData = payload.meta?.custom_data || {};
  const userId = typeof customData.user_id === "string" ? customData.user_id : "";
  if (!userId) {
    console.error("Lemon Squeezy webhook missing user_id custom data", { eventName, subscriptionId });
    return new NextResponse("Missing user mapping", { status: 400 });
  }

  const monthlyVariant = process.env.LEMON_SQUEEZY_VARIANT_MONTHLY;
  const yearlyVariant = process.env.LEMON_SQUEEZY_VARIANT_YEARLY;
  const variantId = String(attributes.variant_id ?? "");
  const customPlan = customData.plan === "yearly" ? "yearly" : customData.plan === "monthly" ? "monthly" : null;
  const plan = customPlan || (variantId === String(yearlyVariant) ? "yearly" : "monthly");

  const rawStatus = attributes.status || "";
  let status: "active" | "past_due" | "cancelled" | "inactive" = "inactive";
  if (rawStatus === "active" || rawStatus === "on_trial") status = "active";
  else if (rawStatus === "past_due" || rawStatus === "unpaid") status = "past_due";
  else if (rawStatus === "cancelled") status = "active"; // paid grace period remains usable until ends_at
  else if (rawStatus === "expired") status = "inactive";
  else if (rawStatus === "paused") status = "inactive";

  const periodEnd = attributes.ends_at || attributes.renews_at || null;
  const supabase = createClient(SUPABASE_URL, serviceRole, { auth: { persistSession: false } });
  const { error } = await supabase.from("memberships").upsert({
    user_id: userId,
    plan,
    status,
    source: "lemon_squeezy",
    lemon_customer_id: attributes.customer_id != null ? String(attributes.customer_id) : null,
    lemon_subscription_id: String(subscriptionId),
    lemon_variant_id: variantId || null,
    payment_processor: attributes.payment_processor || null,
    current_period_end: periodEnd,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to sync Lemon Squeezy membership", error);
    return new NextResponse("Database update failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
