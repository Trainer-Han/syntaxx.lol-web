import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Servers from "@/pages/Servers";
import Dashboard from "@/pages/Dashboard";
import Commands from "@/pages/Commands";
import Verify from "@/pages/Verify";
import Lore from "@/pages/Lore";
import Reviews from "@/pages/Reviews";
import AdBanner from "@/components/AdBanner";

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
          <Router />
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
