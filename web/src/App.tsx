import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdBanner from "@/components/AdBanner";
import { useMediaQuery, BREAKPOINT } from "@/hooks/use-media-query";
import { INK } from "@/theme";

// Home is eager: it is the landing page, and code-splitting it would only add
// a loading flash to the one route most visitors see first. Commands is lazy —
// it is by far the biggest page left, and it is not on the path from a cold
// visit to the invite button.
import Home from "@/pages/Home";

const Commands = lazy(() => import("@/pages/Commands"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));

const queryClient = new QueryClient();

// ── Replace these with your real Ad Slot IDs from AdSense dashboard ──────────
// AdSense → Ads → By ad unit → Display ads → Create → copy "data-ad-slot" value
const LEFT_AD_SLOT  = "0000000000"; // ← replace with your left slot ID
const RIGHT_AD_SLOT = "0000000000"; // ← replace with your right slot ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fixed vertical ad strip, only on screens wide enough that it cannot overlap
 * the content.
 *
 * The gate is a media *query*, not a `hidden 2xl:block` class. Hiding it with
 * CSS still mounted the <ins> and still pushed it to AdSense, which then
 * measured a zero-width element and threw `availableWidth=0` — two uncaught
 * exceptions on every page load for every visitor below the breakpoint, which
 * is most of them. AdBanner's try/catch cannot help: the push() succeeds and
 * AdSense throws later, asynchronously, outside it.
 */
function AdStrip({ side }: { side: "left" | "right" }) {
  if (!useMediaQuery(BREAKPOINT.wide)) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        [side]: 0,
        transform: "translateY(-50%)",
        width: 160,
        zIndex: 50,
        pointerEvents: "auto",
      }}
    >
      <AdBanner
        slot={side === "left" ? LEFT_AD_SLOT : RIGHT_AD_SLOT}
        style={{ width: 160, height: 600 }}
      />
    </div>
  );
}

/**
 * Shown while a lazy page's chunk loads. Deliberately just the page
 * background at full height — a spinner that appears for 80ms on a fast
 * connection reads as a flicker, and anything taller causes a scroll jump
 * when the real page swaps in.
 */
function PageFallback() {
  return <div style={{ minHeight: "100vh", background: INK }} />;
}

/**
 * The site is a static build on GitHub Pages, so every route here has to render
 * from what is in the bundle. The dashboard, login, verification, reviews and
 * lore routes are gone with the Worker that served their data — see README's
 * "What this deployment is not".
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/commands" component={Commands} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Suspense fallback={<PageFallback />}>
            <Router />
          </Suspense>
        </WouterRouter>

        {/* ── Fixed side ad strips (visible only on ≥ 1440px screens) ── */}
        <AdStrip side="left" />
        <AdStrip side="right" />

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
