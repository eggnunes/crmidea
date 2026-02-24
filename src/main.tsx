import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
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

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
