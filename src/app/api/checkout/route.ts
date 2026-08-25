import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lrrlwilhbubyjwiyytsj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fGESICDpU45dU5un7M4ntw_FUrb8yDE";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const monthlyVariant = process.env.LEMON_SQUEEZY_VARIANT_MONTHLY;
    const yearlyVariant = process.env.LEMON_SQUEEZY_VARIANT_YEARLY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    if (!apiKey || !storeId || !monthlyVariant || !yearlyVariant) {
      return NextResponse.json(
        { error: "Payments are not connected yet. Owner: add the Lemon Squeezy environment variables in Vercel." },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (userError || !user) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    const body = await request.json();
    const plan = body?.plan === "yearly" ? "yearly" : "monthly";
    const variantId = plan === "yearly" ? yearlyVariant : monthlyVariant;

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            product_options: {
              redirect_url: `${siteUrl}/pricing?success=1`,
              enabled_variants: [Number(variantId)],
            },
            checkout_options: {
              embed: false,
              media: true,
              logo: true,
              desc: true,
              discount: true,
              subscription_preview: true,
              button_color: "#6d4aff",
            },
            checkout_data: {
              email: user.email || undefined,
              custom: {
                user_id: user.id,
                plan,
              },
            },
          },
          relationships: {
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("Lemon Squeezy checkout error", result);
      const detail = result?.errors?.[0]?.detail;
      return NextResponse.json({ error: detail || "Could not start checkout." }, { status: 502 });
    }

    const url = result?.data?.attributes?.url;
    if (!url) return NextResponse.json({ error: "Lemon Squeezy did not return a checkout URL." }, { status: 500 });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
