interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Pre-built schema generators
export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Rafael Egg",
  "jobTitle": "Mentor em IA para Advocacia",
  "description": "Advogado desde 2008, especialista em Inteligência Artificial para escritórios de advocacia. Criador do Método IDEA.",
  "url": "https://rafaelegg.com",
  "image": "https://rafaelegg.com/og-image.png",
  "sameAs": [
    "https://www.instagram.com/rafaeleggnunes/",
    "https://www.tiktok.com/@rafaeleggnunes",
    "https://youtube.com/@rafaeleggnunes"
  ],
  "knowsAbout": [
    "Inteligência Artificial",
    "Advocacia",
    "Automação Jurídica",
    "ChatGPT para Advogados",
    "Produtividade Jurídica",
    "Legal Tech"
  ],
  "award": "Melhor Escritório em IA do Brasil 2025 - Law Summit"
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Rafael Egg - IA para Advogados",
  "url": "https://rafaelegg.com",
  "logo": "https://rafaelegg.com/og-image.png",
  "description": "Consultoria, mentoria e cursos de Inteligência Artificial para advogados e escritórios de advocacia.",
  "founder": {
    "@type": "Person",
    "name": "Rafael Egg"
  },
  "sameAs": [
    "https://www.instagram.com/rafaeleggnunes/",
    "https://www.tiktok.com/@rafaeleggnunes",
    "https://youtube.com/@rafaeleggnunes"
  ]
};

export function generateArticleSchema(article: {
  title: string;
  excerpt: string | null;
  slug: string;
  published_at: string | null;
  updated_at: string;
  cover_image_url?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt || "",
    "author": {
      "@type": "Person",
      "name": "Rafael Egg",
      "url": "https://rafaelegg.com"
    },
    "datePublished": article.published_at || article.updated_at,
    "dateModified": article.updated_at,
    "publisher": {
      "@type": "Organization",
      "name": "Rafael Egg - IA para Advogados",
      "logo": {
        "@type": "ImageObject",
        "url": "https://rafaelegg.com/og-image.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://rafaelegg.com/blog/${article.slug}`
    },
    "image": article.cover_image_url || "https://rafaelegg.com/og-image.png"
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateCourseSchema(course: {
  name: string;
  description: string;
  provider: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": course.provider,
      "sameAs": "https://rafaelegg.com"
    },
    "url": course.url
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  provider: string;
  url: string;
  priceRange?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Person",
      "name": service.provider,
      "url": "https://rafaelegg.com"
    },
    "url": service.url,
    "priceRange": service.priceRange || "$$$$"
  };
}
