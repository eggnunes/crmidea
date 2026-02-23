import { Helmet } from "react-helmet";
import { getSEORouteData, SEORouteData } from "@/data/seoRoutes";

interface SEOHeadProps {
  /** Route path to look up in the registry, e.g. "/consultoria" */
  path: string;
  /** Optional overrides (useful for dynamic pages like blog articles) */
  overrides?: Partial<Pick<SEORouteData, "title" | "description" | "canonical" | "ogTitle" | "ogDescription" | "ogImage" | "jsonLd">>;
}

/**
 * Renders SEO meta tags + JSON-LD from the centralized seoRoutes registry.
 * Falls back gracefully if the route isn't found in the registry.
 */
export function SEOHead({ path, overrides }: SEOHeadProps) {
  const routeData = getSEORouteData(path);

  if (!routeData && !overrides) return null;

  const title = overrides?.title || routeData?.title || "";
  const description = overrides?.description || routeData?.description || "";
  const canonical = overrides?.canonical || routeData?.canonical || "";
  const ogTitle = overrides?.ogTitle || routeData?.ogTitle || title;
  const ogDescription = overrides?.ogDescription || routeData?.ogDescription || description;
  const ogImage = overrides?.ogImage || routeData?.ogImage || "";
  const jsonLd = overrides?.jsonLd || routeData?.jsonLd || [];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Rafael Egg" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Rafael Egg - IA para Advogados" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* JSON-LD structured data */}
        {jsonLd.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>
    </>
  );
}
