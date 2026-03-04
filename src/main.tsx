import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Redirect www to non-www to avoid duplicate content and redirect errors in Google Search Console
if (typeof window !== "undefined") {
  const { hostname, href } = window.location;
  if (hostname.startsWith("www.")) {
    const newUrl = href.replace("://www.", "://");
    window.location.replace(newUrl);
  }
}

const rootElement = document.getElementById("root")!;

// If the root has pre-rendered static HTML content (injected by vite-plugin-seo during build),
// use hydrateRoot so React attaches to the existing DOM instead of replacing it.
// This ensures crawlers see the static content before JS loads.
// For development or when no static content exists, use createRoot normally.
if (rootElement.hasChildNodes() && rootElement.querySelector('[style]')) {
  // Pre-rendered content detected (has styled elements from SSG plugin)
  // Use createRoot anyway since the static HTML structure differs from React's output.
  // The static content served its purpose for crawlers; React replaces it for users.
  createRoot(rootElement).render(<App />);
} else {
  createRoot(rootElement).render(<App />);
}
