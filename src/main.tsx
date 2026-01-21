import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SEO / Consistência de domínio: evita que o Google (e usuários) acessem via www
// quando o site canônico é o domínio raiz.
if (typeof window !== "undefined") {
  const { hostname, protocol, pathname, search, hash } = window.location;
  if (hostname.startsWith("www.")) {
    const targetHost = hostname.replace(/^www\./, "");
    window.location.replace(`${protocol}//${targetHost}${pathname}${search}${hash}`);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
