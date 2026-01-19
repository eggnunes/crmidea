const RobotsTxtPage = () => {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: https://rafaelegg.com/sitemap.xml`;

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap',
      margin: 0,
      padding: 0,
      background: 'white',
      color: 'black'
    }}>
      {robotsContent}
    </pre>
  );
};

export default RobotsTxtPage;
