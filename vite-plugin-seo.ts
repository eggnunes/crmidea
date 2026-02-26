/**
 * Vite plugin that generates per-route HTML files during build.
 * Each route gets a unique index.html with specific meta tags, JSON-LD, etc.
 */
import type { Plugin } from 'vite';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface SEORouteData {
  path: string;
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  h1: string;
  staticContent: string;
  noscriptContent: string;
  jsonLd: object[];
  lastModified: string;
  sitemapPriority: number;
  changeFrequency: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function generateHtmlForRoute(route: SEORouteData, template: string): string {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${route.canonical}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(route.ogTitle)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(route.ogDescription)}" />`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${route.ogImage}" />`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${route.canonical}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(route.ogTitle)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(route.ogDescription)}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${route.ogImage}" />`
  );

  // Replace all existing JSON-LD scripts with route-specific ones
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

  // Insert new JSON-LD blocks before </head>
  const jsonLdScripts = route.jsonLd
    .map(schema => `    <script type="application/ld+json">\n    ${JSON.stringify(schema)}\n    </script>`)
    .join('\n');
  html = html.replace('</head>', `${jsonLdScripts}\n  </head>`);

  // Replace seo-static-content div
  html = html.replace(
    /<div id="seo-static-content"[^>]*>[\s\S]*?<\/div>/,
    `<div id="seo-static-content" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;">\n${route.staticContent}\n      </div>`
  );

  // Replace noscript content
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>\n      ${route.noscriptContent}\n    </noscript>`
  );

  return html;
}

export function seoPlugin(routes: SEORouteData[]): Plugin {
  return {
    name: 'vite-plugin-seo-pages',
    apply: 'build',
    closeBundle() {
      const distDir = join(process.cwd(), 'dist');
      let templateHtml: string;
      
      try {
        templateHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');
      } catch {
        console.warn('[seo-plugin] Could not read dist/index.html, skipping SEO page generation');
        return;
      }

      console.log(`\n🔧 [SEO Plugin] Generating ${routes.length} route-specific HTML files...\n`);

      // Update root index.html with homepage data
      const homeRoute = routes.find(r => r.path === '/');
      if (homeRoute) {
        const homeHtml = generateHtmlForRoute(homeRoute, templateHtml);
        writeFileSync(join(distDir, 'index.html'), homeHtml, 'utf-8');
        console.log(`  ✅ / → dist/index.html`);
      }

      // Generate sub-route HTML files
      for (const route of routes) {
        if (route.path === '/') continue;

        const routeHtml = generateHtmlForRoute(route, templateHtml);
        const routePath = route.path.startsWith('/') ? route.path.slice(1) : route.path;
        const outputDir = join(distDir, routePath);
        const outputFile = join(outputDir, 'index.html');

        mkdirSync(outputDir, { recursive: true });
        writeFileSync(outputFile, routeHtml, 'utf-8');
        console.log(`  ✅ ${route.path} → dist/${routePath}/index.html`);
      }

      // Generate sitemap.xml in dist
      const sitemapEntries = routes.map(route => `  <url>
    <loc>${route.canonical}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.sitemapPriority}</priority>
  </url>`).join('\n');

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;

      writeFileSync(join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
      console.log(`  ✅ sitemap.xml (${routes.length} URLs)`);

      console.log(`\n✨ [SEO Plugin] Done!\n`);
    }
  };
}
