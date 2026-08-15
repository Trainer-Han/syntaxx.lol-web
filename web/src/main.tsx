import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Loaded globally, and after index.css on purpose. sx-btn is the site's button
// system now — nav, hero, both CTAs, the legal pages and the 404 — so importing
// it per page means any page that forgets renders an unstyled anchor. It comes
// second so its rules win over Tailwind's preflight at equal specificity.
import "./styles/sx-btn.css";

createRoot(document.getElementById("root")!).render(<App />);
