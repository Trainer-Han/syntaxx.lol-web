import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Zap, ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import logoUrl from "/syntaxx-logo.png";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#1e1e1e";
const BORDER = "#2e2e2e";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";
const GREEN  = "#57F287";

interface Price   { id: string; amount: number; currency: string; interval: string; }
interface Product { id: string; name: string; description: string; prices: Price[]; }

const FREE_FEATURES = [
  "120+ commands",
  "Basic auto-mod (spam detection)",
  "Welcome messages",
  "Economy system",
  "Leveling system",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Custom Commands (auto-replies)",
  "Advanced auto-mod (AI-powered)",
  "Custom welcome embeds",
  "Priority support",
  "Unlimited mod log history",
  "Custom bot status per server",
  "Early access to new features",
];

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("nl-BE", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100);
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export default function Pricing() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [interval,  setInterval_] = useState<"month" | "year">("month");
  const [loading,   setLoading]   = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [user,      setUser]      = useState<{ id: string; username: string } | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    fetch("/api/stripe/products", { credentials: "include" })
      .then(r => r.json()).then((d: Product[]) => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json()).then((d: { user: typeof user }) => { if (d.user) setUser(d.user); }).catch(() => {});
  }, []);

  async function startCheckout(priceId: string) {
    if (!user) {
      sessionStorage.setItem("pendingPriceId", priceId);
      window.location.href = "/api/auth/login";
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setCheckoutLoading(false);
    } catch {
      setCheckoutLoading(false);
    }
  }

  const proProduct = products[0];
  const proPrice = proProduct?.prices.find(p => p.interval === interval);
  const yearlyPrice = proProduct?.prices.find(p => p.interval === "year");
  const monthlyPrice = proProduct?.prices.find(p => p.interval === "month");
  const yearlySaving = monthlyPrice && yearlyPrice
    ? Math.round((1 - yearlyPrice.amount / (monthlyPrice.amount * 12)) * 100)
    : 0;

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)", backgroundColor: "rgba(18,18,18,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/">
            <img src={logoUrl} alt="Syntaxx" style={{ height: 30, width: "auto", cursor: "pointer" }} />
          </Link>
          <Link href="/" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px 80px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}40`, borderRadius: 999, padding: "5px 14px", marginBottom: 20, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
            <Zap size={12} /> Simple, transparent pricing
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px" }}>
            Upgrade your server
          </h1>
          <p style={{ color: MUTED, fontSize: 16, margin: "0 0 40px" }}>
            Start free. Upgrade when you need more power.
          </p>

          {/* Interval toggle */}
          <div style={{ display: "inline-flex", backgroundColor: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 4, marginBottom: 52, gap: 4 }}>
            {(["month", "year"] as const).map(iv => (
              <button key={iv} onClick={() => setInterval_(iv)}
                style={{ padding: "8px 20px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "all 0.15s",
                  backgroundColor: interval === iv ? ACCENT : "transparent",
                  color: interval === iv ? "#121212" : MUTED }}>
                {iv === "month" ? "Monthly" : `Yearly ${yearlySaving ? `(save ${yearlySaving}%)` : ""}`}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, textAlign: "left" }}>
            {/* Free plan */}
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "36px 32px" }}>
              <p style={{ color: MUTED, fontSize: 13, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Free</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>€0</span>
                <span style={{ color: MUTED, fontSize: 14 }}>/month</span>
              </div>
              <p style={{ color: MUTED, fontSize: 13, margin: "0 0 28px" }}>Perfect for small communities</p>
              <div style={{ marginBottom: 28 }}>
                {FREE_FEATURES.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Check size={14} color={GREEN} strokeWidth={2.5} />
                    <span style={{ fontSize: 14, color: MUTED }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href={`https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands`}
                target="_blank" rel="noreferrer"
                style={{ display: "block", textAlign: "center", backgroundColor: "rgba(255,255,255,0.06)", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "13px 0", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Add to Discord <ExternalLink size={13} style={{ verticalAlign: "middle", marginLeft: 4 }} />
              </a>
            </div>

            {/* Pro plan */}
            <div style={{ backgroundColor: CARD, border: `2px solid ${ACCENT}`, borderRadius: 20, padding: "36px 32px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 18, right: 18, backgroundColor: ACCENT, color: "#121212", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>Popular</div>
              <p style={{ color: ACCENT, fontSize: 13, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Pro</p>
              {loading ? (
                <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 6 }}>…</div>
              ) : proPrice ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800 }}>{fmt(proPrice.amount, proPrice.currency)}</span>
                  <span style={{ color: MUTED, fontSize: 14 }}>/{proPrice.interval}</span>
                </div>
              ) : (
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: MUTED }}>Coming soon</div>
              )}
              <p style={{ color: MUTED, fontSize: 13, margin: "0 0 28px" }}>For serious Discord communities</p>
              <div style={{ marginBottom: 28 }}>
                {PRO_FEATURES.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Check size={14} color={ACCENT} strokeWidth={2.5} />
                    <span style={{ fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => proPrice && startCheckout(proPrice.id)}
                disabled={!proPrice || checkoutLoading}
                style={{ display: "block", width: "100%", textAlign: "center", backgroundColor: proPrice ? ACCENT : "#333", color: "#121212", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 800, fontSize: 15, cursor: proPrice ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: checkoutLoading ? 0.7 : 1 }}>
                {checkoutLoading ? "Redirecting…" : user ? "Upgrade to Pro" : "Login to upgrade"}
              </button>
              {!user && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "10px 0 0" }}>You'll be asked to log in with Discord first</p>}
            </div>
          </div>

          <p style={{ color: MUTED, fontSize: 13, marginTop: 32 }}>
            Cancel anytime · Secure payment by Stripe · Need help? Join our <a href="https://discord.gg/qQMqbVnWH8" style={{ color: ACCENT, textDecoration: "none" }}>Discord server</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
