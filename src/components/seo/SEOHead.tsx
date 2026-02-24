import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  noIndex?: boolean;
  schemaJson?: object | object[];
  ogType?: string;
}

const DEFAULT_OG_IMAGE = "https://rafaelegg.com/og-image.png";

function setMeta(attr: string, key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Sets SEO meta tags directly on document.head.
 * No external dependencies required.
 */
export function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  noIndex = false,
  schemaJson,
  ogType = "website",
}: SEOHeadProps) {
  const image = ogImage || DEFAULT_OG_IMAGE;
  const robots = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  useEffect(() => {
    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", robots);
    setMeta("name", "author", "Rafael Egg");
    setLink("canonical", canonical);

    // Open Graph
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", "Rafael Egg - IA para Advogados");
    setMeta("property", "og:locale", "pt_BR");

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:url", canonical);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    // JSON-LD — remove ALL json-ld scripts (including ones injected by build plugin)
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
    const schemas = schemaJson
      ? Array.isArray(schemaJson) ? schemaJson : [schemaJson]
      : [];
    schemas.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });
  }, [title, description, canonical, image, noIndex, schemaJson, ogType, robots]);

  return null;
}
