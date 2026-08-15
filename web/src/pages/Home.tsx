import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Coins, TrendingUp, Zap, ScanSearch, Sparkles,
  ExternalLink, CheckCircle2, Menu, X,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";
import { INVITE_URL } from "@/config";
import "@/styles/sx-btn.css";

// ── Brand colours ─────────────────────────────────────────────────────────────
const ACCENT  = "#B8A05B";
const BG      = "#121212";
const CARD    = "#2a2a2a";
const BORDER  = "#383838";
const TEXT    = "#eeeeee";
const MUTED   = "#888888";
const GREEN   = "#57F287";

const features = [
  { icon: Shield,     title: "Moderation",  color: "#c0392b", desc: "Ban, kick, mute, case tracking, purge, anti-raid and custom commands per server." },
  { icon: Coins,      title: "Economy",     color: ACCENT,    desc: "Chip system, wallet, casino, blackjack, roulette, slots and mines." },
  { icon: TrendingUp, title: "Leveling",    color: GREEN,     desc: "XP system, leaderboard, automatic level roles and server ranking." },
  { icon: Zap,        title: "Auto-Mod",    color: ACCENT,    desc: "Anti-spam, attachment filter, raid protection and configurable automod rules." },
  { icon: ScanSearch, title: "Alt Scanner", color: "#9b59b6", desc: "Detect alt accounts based on account age and behaviour patterns." },
  { icon: Sparkles,   title: "Fun & Tools", color: GREEN,     desc: "Color roles, AFK system, GIF editor, QR codes, sticker stealing and more." },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)", backgroundColor: "rgba(18,18,18,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexShrink: 0 }}>
            <img src={logoUrl} alt="Syntaxx" style={{ height: 30, width: "auto", flexShrink: 0 }} />
          </div>
          <div style={{ display: "flex", gap: isMobile ? 6 : 16, alignItems: "center", flexShrink: 0 }}>
            {!isMobile && <>
              <a href="#features" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Features</a>
              <Link href="/commands" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Commands</Link>
            </>}
            {isMobile && (
              <button onClick={() => setShowMenu(v => !v)}
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px", color: TEXT, cursor: "pointer", display: "flex", alignItems: "center" }}>
                {showMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
            <a href={INVITE_URL} target="_blank" rel="noreferrer" className="sx-btn sx-btn--primary sx-btn--sm">
              {isMobile ? "Invite" : <>Invite <ExternalLink size={13} /></>}
            </a>
          </div>
        </div>
        {isMobile && showMenu && (
          <div style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.98)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <a href="#features" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Features</a>
            <Link href="/commands" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Commands</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(184,160,91,0.1)", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 999, padding: "6px 16px", marginBottom: 28, fontSize: 13, color: ACCENT }}>
            syntaxx.LOL — Belgian Discord Bot
          </div>
          <h1 style={{ fontSize: "clamp(40px,7.5vw,78px)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px", color: TEXT }}>
            The most powerful<br />
            <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #d4b87a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Discord Bot</span>{" "}
            for your server
          </h1>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 520, margin: "0 auto 44px", lineHeight: 1.7 }}>
            Moderation, economy, leveling, auto-mod and more. Everything your server needs in one bot.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={INVITE_URL} target="_blank" rel="noreferrer" className="sx-btn sx-btn--primary">
              Invite Bot <ExternalLink size={16} />
            </a>
            <a href="#features" className="sx-btn sx-btn--ghost">
              Learn more
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", color: TEXT }}>Everything you need</h2>
          <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>Powerful features, easy to use</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 }}
              whileHover={{ borderColor: ACCENT + "55", translateY: -2 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.color + "20", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: TEXT }}>{f.title}</h3>
              <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: `linear-gradient(135deg, rgba(184,160,91,0.12) 0%, rgba(184,160,91,0.04) 100%)`, border: `1px solid rgba(184,160,91,0.25)`, borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", color: TEXT }}>Ready to get started?</h2>
          <p style={{ color: MUTED, fontSize: 16, margin: "0 0 32px" }}>Add Syntaxx to your server and experience the difference.</p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            {["Free to use", "Instant setup", "Regular updates", "Support available"].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: ACCENT, fontSize: 14, fontWeight: 500 }}>
                <CheckCircle2 size={14} color={GREEN} />{item}
              </span>
            ))}
          </div>
          <a href={INVITE_URL} target="_blank" rel="noreferrer" className="sx-btn sx-btn--primary">
            Invite Syntaxx <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* ── Support / Donate ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: "1px solid rgba(184,160,91,0.22)", background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: isMobile ? "44px 24px" : "60px 60px", textAlign: "center" }}>

          <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 480, height: 240, background: "radial-gradient(ellipse, rgba(184,160,91,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: -60, width: 260, height: 260, background: "radial-gradient(ellipse, rgba(184,160,91,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: isMobile ? 44 : 52, marginBottom: 18, lineHeight: 1 }}>☕</div>
            <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px", color: TEXT }}>
              Enjoying Syntaxx?
            </h2>
            <p style={{ color: MUTED, fontSize: 15, margin: "0 auto 36px", maxWidth: 440, lineHeight: 1.75 }}>
              Syntaxx is completely free. If it's saved you time or made your server better, a coffee keeps the lights on!
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
              {["Credit card", "Apple Pay", "Google Pay", "PayPal"].map(m => (
                <span key={m} style={{ fontSize: 12, fontWeight: 600, color: ACCENT, backgroundColor: "rgba(184,160,91,0.1)", border: "1px solid rgba(184,160,91,0.22)", borderRadius: 999, padding: "4px 12px" }}>{m}</span>
              ))}
            </div>

            <a href="https://www.buymeacoffee.com/syntaxx.lol" target="_blank" rel="noreferrer" className="sx-btn sx-btn--primary">
              ☕ Buy me a coffee
            </a>

            <p style={{ color: "#3a3a3a", fontSize: 12, marginTop: 20, marginBottom: 0 }}>
              Secure payments via Buy Me a Coffee · Powered by Stripe
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto", marginBottom: 10, opacity: 0.8 }} />
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
            <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
            {" · "}
            <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
