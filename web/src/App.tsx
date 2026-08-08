import { Suspense, lazy } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdBanner from "@/components/AdBanner";

// Home is eager: it is the landing page, and code-splitting it would only add
// a loading flash to the one route most visitors see first. Everything else is
// lazy — Dashboard, Commands and Lore are the three biggest pages in the app,
// and none of them are on the path from a cold visit to the invite button.
import Home from "@/pages/Home";

const Commands = lazy(() => import("@/pages/Commands"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Lore = lazy(() => import("@/pages/Lore"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const Servers = lazy(() => import("@/pages/Servers"));
const Terms = lazy(() => import("@/pages/Terms"));
const Verify = lazy(() => import("@/pages/Verify"));

const queryClient = new QueryClient();

// ── Replace these with your real Ad Slot IDs from AdSense dashboard ──────────
// AdSense → Ads → By ad unit → Display ads → Create → copy "data-ad-slot" value
const LEFT_AD_SLOT  = "0000000000"; // ← replace with your left slot ID
const RIGHT_AD_SLOT = "0000000000"; // ← replace with your right slot ID
// ─────────────────────────────────────────────────────────────────────────────

/** Fixed vertical ad strip — only rendered when viewport is wide enough */
function AdStrip({ side }: { side: "left" | "right" }) {
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
      // hide on screens narrower than 1440px so ads never overlap content
      className="hidden 2xl:block"
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
  return <div style={{ minHeight: "100vh", background: "hsl(var(--background))" }} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/commands" component={Commands} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/servers" component={Servers} />
      <Route path="/dashboard/:id" component={Dashboard} />
      <Route path="/verify" component={Verify} />
      <Route path="/lore/:serverId" component={Lore} />
      <Route path="/lore" component={Lore} />
      <Route path="/reviews" component={Reviews} />
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
