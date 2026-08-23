import { NextRequest, NextResponse } from "next/server";

const PAPERS: Record<string, string> = {
  "2021-1H": "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel-IGCSE-A/Paper-1H/QP/January%202021%20QP.pdf",
  "2022-1HR": "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel-IGCSE-A/Paper-1H/QP/January%202022%20%28R%29%20QP.pdf",
  "2024-1H": "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel-IGCSE-A/Paper-1H/QP/June%202024%20QP.pdf",
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key") || "";
  const source = PAPERS[key];
  if (!source) return NextResponse.json({ error: "Unknown paper" }, { status: 404 });

  const response = await fetch(source, { next: { revalidate: 86400 } });
  if (!response.ok) return NextResponse.json({ error: "Source paper unavailable" }, { status: 502 });
  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
