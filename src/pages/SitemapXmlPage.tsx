import { generateSitemapXml } from "@/data/seoRoutes";

const SitemapXmlPage = () => {
  const sitemapContent = generateSitemapXml();

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap',
      margin: 0,
      padding: 0,
      background: 'white',
      color: 'black'
    }}>
      {sitemapContent}
    </pre>
  );
};

export default SitemapXmlPage;
