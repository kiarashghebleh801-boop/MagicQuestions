import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lrrlwilhbubyjwiyytsj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fGESICDpU45dU5un7M4ntw_FUrb8yDE";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    const monthlyPrice = process.env.STRIPE_PRICE_MONTHLY;
    const yearlyPrice = process.env.STRIPE_PRICE_YEARLY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    if (!secret || !monthlyPrice || !yearlyPrice) {
      return NextResponse.json({ error: "Payments are not connected yet. Owner: add the Stripe environment variables in Vercel." }, { status: 503 });
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });

    const body = await request.json();
    const plan = body?.plan === "yearly" ? "yearly" : "monthly";
    const price = plan === "yearly" ? yearlyPrice : monthlyPrice;

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      success_url: `${siteUrl}/pricing?success=1`,
      cancel_url: `${siteUrl}/pricing?cancelled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
