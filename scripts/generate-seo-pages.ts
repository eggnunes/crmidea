/**
 * Post-build script: generates unique index.html for each SEO route.
 * Run after `vite build` to create per-route HTML files in dist/.
 * 
 * Usage: node scripts/generate-seo-pages.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// We import the registry data inline since this runs as a build script
// and can't import .ts directly. We'll use the compiled version or duplicate the data.

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

// This script is called by the Vite plugin, which passes the routes as JSON
const routesJson = process.argv[2];
if (!routesJson) {
  console.error('Usage: node generate-seo-pages.mjs <routes-json-file>');
  process.exit(1);
}

const routes: SEORouteData[] = JSON.parse(readFileSync(routesJson, 'utf-8'));
const distDir = join(process.cwd(), 'dist');
const templateHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

function generateHtmlForRoute(route: SEORouteData, template: string): string {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${route.description}"`
  );

  // Replace canonical
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${route.canonical}"`
  );

  // Replace OG tags
  html = html.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${route.canonical}"`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${route.ogTitle}"`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${route.ogDescription}"`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${route.ogTitle}"`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${route.ogDescription}"`
  );

  // Replace all JSON-LD scripts with route-specific ones
  // Remove existing JSON-LD blocks
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

  // Insert new JSON-LD blocks before </head>
  const jsonLdScripts = route.jsonLd
    .map(schema => `    <script type="application/ld+json">\n    ${JSON.stringify(schema)}\n    </script>`)
    .join('\n');
  html = html.replace('</head>', `${jsonLdScripts}\n  </head>`);

  // Replace seo-static-content
  html = html.replace(
    /<div id="seo-static-content"[^>]*>[\s\S]*?<\/footer>\s*<\/div>/,
    `<div id="seo-static-content">\n${route.staticContent}\n      </div>`
  );

  // Replace noscript content
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>\n      ${route.noscriptContent}\n    </noscript>`
  );

  return html;
}

console.log(`\n🔧 Generating SEO pages for ${routes.length} routes...\n`);

for (const route of routes) {
  if (route.path === '/') continue; // Homepage already has index.html at root

  const routeHtml = generateHtmlForRoute(route, templateHtml);
  const routePath = route.path.startsWith('/') ? route.path.slice(1) : route.path;
  const outputDir = join(distDir, routePath);
  const outputFile = join(outputDir, 'index.html');

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputFile, routeHtml, 'utf-8');
  console.log(`  ✅ ${route.path} → dist/${routePath}/index.html`);
}

// Also update the root index.html with homepage-specific data
const homeRoute = routes.find(r => r.path === '/');
if (homeRoute) {
  const homeHtml = generateHtmlForRoute(homeRoute, templateHtml);
  writeFileSync(join(distDir, 'index.html'), homeHtml, 'utf-8');
  console.log(`  ✅ / → dist/index.html (updated)`);
}

// Generate sitemap.xml
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
console.log(`  ✅ sitemap.xml → dist/sitemap.xml (${routes.length} URLs)`);

console.log(`\n✨ SEO pages generated successfully!\n`);
