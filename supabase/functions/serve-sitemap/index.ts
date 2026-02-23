import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  const { data: posts } = await supabaseClient
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  // Static routes
  const staticRoutes = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/consultoria", priority: "0.9", changefreq: "monthly" },
    { loc: "/consultoria/economia", priority: "0.8", changefreq: "monthly" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/bio", priority: "0.7", changefreq: "monthly" },
    { loc: "/ebook", priority: "0.7", changefreq: "monthly" },
    { loc: "/privacidade", priority: "0.3", changefreq: "yearly" },
  ];

  let entries = staticRoutes.map(r => `  <url>
    <loc>https://rafaelegg.com${r.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n');

  if (posts) {
    for (const post of posts) {
      const lastmod = (post.updated_at || post.published_at || today).split("T")[0];
      entries += `\n  <url>
    <loc>https://rafaelegg.com/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
