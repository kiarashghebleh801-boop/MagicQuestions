import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://magic-questions.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/owner", "/banned"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
