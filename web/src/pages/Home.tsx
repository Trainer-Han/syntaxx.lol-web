import { motion, useReducedMotion } from "framer-motion";
import {
  Shield, Coins, TrendingUp, Zap, ScanSearch, Sparkles,
  ExternalLink, CheckCircle2, Terminal, ArrowRight,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";
import { Link } from "wouter";
import { INVITE_URL } from "@/config";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  PAGE, INK, SURFACE, BORDER, TEXT, MUTED, SUBTLE,
  GOLD, GOLD_BRIGHT, PLATINUM, GREEN, HUE,
  RADIUS, LAYOUT, GOLD_GRADIENT, SHADOW, alpha,
} from "@/theme";

const features = [
  { icon: Shield,     title: "Moderation",  color: HUE.moderation, desc: "Ban, kick, mute, case tracking, purge, anti-raid and custom commands per server." },
  { icon: Coins,      title: "Economy",     color: GOLD,           desc: "Chip system, wallet, casino, blackjack, roulette, slots and mines." },
  { icon: TrendingUp, title: "Leveling",    color: GREEN,          desc: "XP system, leaderboard, automatic level roles and server ranking." },
  { icon: Zap,        title: "Auto-Mod",    color: HUE.casino,     desc: "Anti-spam, attachment filter, raid protection and configurable automod rules." },
  { icon: ScanSearch, title: "Alt Scanner", color: HUE.toggles,    desc: "Detect alt accounts based on account age and behaviour patterns." },
  { icon: Sparkles,   title: "Fun & Tools", color: PLATINUM,       desc: "Color roles, AFK system, GIF editor, QR codes, sticker stealing and more." },
];

/**
 * Claims the hero makes concrete.
 *
 * These numbers describe the catalogue in Commands.tsx, but are written out
 * rather than derived from it: importing that array here would pull the whole
 * 27 kB command list into the landing page's bundle and undo the code-split
 * App.tsx sets up deliberately.
 *
 * That makes them capable of going stale, so `scripts/verify.js` counts the
 * real catalogue and fails if either figure stops being true. Change a command
 * or a category and the check will tell you to change these too.
 */
const stats = [
  { value: "100+", label: "Commands" },
  { value: "14",   label: "Categories" },
  { value: "Free", label: "Every feature" },
];

export default function Home() {
  const isMobile = useIsMobile();
  // framer-motion applies this to its own transitions, but the entrance
  // offsets below are ours to withdraw: with reduced motion requested, the
  // content should simply be there rather than travel to its position.
  const still = useReducedMotion();

  const rise = (delay = 0) =>
    still
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay } }
      : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } };

  const riseInView = (delay = 0) =>
    still
      ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.2, delay } }
      : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.45, delay } };

  const section: React.CSSProperties = {
    maxWidth: LAYOUT.maxWidth,
    margin: "0 auto",
    padding: `0 ${isMobile ? LAYOUT.gutterMobile : LAYOUT.gutter}px`,
  };

  return (
    <div style={PAGE}>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteNav current="home" />

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ ...section, position: "relative", paddingTop: isMobile ? 64 : 104, paddingBottom: isMobile ? 56 : 88, textAlign: "center" }}>
          {/* Ambient light behind the headline, in the logo's two colours.
              Sits behind content and never intercepts a click.

              The ellipse radii are given explicitly, as percentages of the box,
              rather than left to the default `farthest-corner`. With the
              default, the gradient reaches full transparency at the distance to
              the furthest corner — which is further than the nearest edge, so
              it was still tinted where the box ended and drew a visible
              rectangle with hard vertical sides across the hero. Sized this
              way, each glow finishes inside its own bounds on every axis. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
              width: "min(760px, 100%)", height: 420, pointerEvents: "none", zIndex: 0,
              background: `radial-gradient(ellipse 40% 42% at 44% 45%, ${alpha(GOLD, 0.17)} 0%, ${alpha(GOLD, 0)} 100%),
                           radial-gradient(ellipse 34% 38% at 60% 48%, ${alpha(PLATINUM, 0.09)} 0%, ${alpha(PLATINUM, 0)} 100%)`,
            }}
          />

          <motion.div {...rise()} style={{ position: "relative", zIndex: 1 }}>
            <img
              src={logoUrl}
              alt="The Syntaxx logo: a gold and a platinum diamond overlapping"
              width={isMobile ? 76 : 92}
              height={isMobile ? 76 : 92}
              style={{
                width: isMobile ? 76 : 92, height: isMobile ? 76 : 92,
                // Tailwind's preflight sets `img { display: block }`, so the
                // section's text-align:center does not reach it — an auto
                // margin is what actually centres a block-level image.
                margin: "0 auto 26px",
                filter: `drop-shadow(0 8px 32px ${alpha(GOLD, 0.3)})`,
              }}
            />

            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                backgroundColor: alpha(GOLD, 0.09),
                border: `1px solid ${alpha(GOLD, 0.26)}`,
                borderRadius: RADIUS.pill, padding: "6px 15px", marginBottom: 26,
                fontSize: 13, color: GOLD, fontWeight: 500,
              }}
            >
              <span
                aria-hidden="true"
                style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: GREEN, boxShadow: `0 0 8px ${GREEN}` }}
              />
              Belgian Discord Bot
            </div>

            <h1
              style={{
                fontSize: "clamp(38px, 7vw, 74px)", fontWeight: 800, lineHeight: 1.06,
                margin: "0 0 22px", letterSpacing: "-0.035em", color: TEXT,
              }}
            >
              The most powerful
              <br />
              <span
                style={{
                  background: GOLD_GRADIENT,
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  WebkitTextFillColor: "transparent", color: GOLD,
                }}
              >
                Discord bot
              </span>{" "}
              for your server
            </h1>

            <p style={{ fontSize: isMobile ? 16 : 18, color: MUTED, maxWidth: 540, margin: "0 auto 38px", lineHeight: 1.65 }}>
              Moderation, economy, leveling, auto-mod and more. Everything your
              server needs, in one bot.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={INVITE_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-gold"
                aria-label="Invite Syntaxx to your Discord server (opens in a new tab)"
                style={{
                  background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
                  color: INK, padding: "15px 34px", borderRadius: RADIUS.md,
                  fontSize: 16, fontWeight: 700, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 9,
                  boxShadow: SHADOW.gold, letterSpacing: "-0.01em",
                }}
              >
                Invite Bot <ExternalLink size={16} aria-hidden="true" />
              </a>
              <Link
                href="/commands"
                className="btn-ghost"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)", color: TEXT,
                  padding: "15px 30px", borderRadius: RADIUS.md, fontSize: 16,
                  fontWeight: 600, textDecoration: "none", border: `1px solid ${BORDER}`,
                  display: "inline-flex", alignItems: "center", gap: 9,
                }}
              >
                <Terminal size={16} aria-hidden="true" /> Browse commands
              </Link>
            </div>

            {/* Proof, immediately under the ask. */}
            <ul
              style={{
                display: "flex", gap: isMobile ? 28 : 52, justifyContent: "center",
                flexWrap: "wrap", margin: "48px 0 0", padding: 0, listStyle: "none",
              }}
            >
              {stats.map((s) => (
                <li key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: TEXT, letterSpacing: "-0.03em" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12.5, color: SUBTLE, marginTop: 3, letterSpacing: "0.03em" }}>
                    {s.label}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section id="features" style={{ ...section, paddingBottom: isMobile ? 64 : 92 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <h2 style={{ fontSize: isMobile ? 28 : 38, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em", color: TEXT }}>
              Everything you need
            </h2>
            <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>Powerful features, easy to use.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(288px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <motion.article
                key={f.title}
                {...riseInView(Math.min(i, 3) * 0.06)}
                className="card-lift"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: RADIUS.lg,
                  padding: 26,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 44, height: 44, borderRadius: RADIUS.md,
                    backgroundColor: alpha(f.color, 0.13),
                    border: `1px solid ${alpha(f.color, 0.22)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <f.icon size={21} color={f.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: TEXT, letterSpacing: "-0.01em" }}>
                  {f.title}
                </h3>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </motion.article>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link
              href="/commands"
              className="link-quiet"
              style={{ color: GOLD, fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              See all 100+ commands <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section style={{ ...section, paddingBottom: isMobile ? 64 : 92 }}>
          <motion.div
            {...riseInView()}
            style={{
              position: "relative", overflow: "hidden",
              background: `linear-gradient(135deg, ${alpha(GOLD, 0.11)} 0%, ${alpha(PLATINUM, 0.04)} 100%)`,
              border: `1px solid ${alpha(GOLD, 0.24)}`,
              borderRadius: RADIUS.xl,
              padding: isMobile ? "44px 24px" : "62px 40px",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em", color: TEXT }}>
              Ready to get started?
            </h2>
            <p style={{ color: MUTED, fontSize: 16, margin: "0 0 30px" }}>
              Add Syntaxx to your server and experience the difference.
            </p>

            <ul
              style={{
                display: "flex", gap: isMobile ? 14 : 26, justifyContent: "center",
                flexWrap: "wrap", margin: "0 0 34px", padding: 0, listStyle: "none",
              }}
            >
              {["Free to use", "Instant setup", "Regular updates", "Support available"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 7, color: TEXT, fontSize: 14, fontWeight: 500 }}>
                  <CheckCircle2 size={15} color={GREEN} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-gold"
              aria-label="Invite Syntaxx to your Discord server (opens in a new tab)"
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
                color: INK, padding: "15px 38px", borderRadius: RADIUS.md,
                fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: SHADOW.gold,
              }}
            >
              Invite Syntaxx <ExternalLink size={16} aria-hidden="true" />
            </a>
          </motion.div>
        </section>

        {/* ── Support / Donate ─────────────────────────────────────────── */}
        <section style={{ ...section, paddingBottom: isMobile ? 64 : 92 }}>
          <motion.div
            {...riseInView()}
            style={{
              position: "relative", overflow: "hidden", borderRadius: RADIUS.xl,
              border: `1px solid ${BORDER}`, backgroundColor: SURFACE,
              padding: isMobile ? "44px 24px" : "58px 60px", textAlign: "center",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute", top: -90, left: "50%", transform: "translateX(-50%)",
                width: 480, height: 240, pointerEvents: "none",
                // Explicit radii, for the reason given at the hero glow above.
                background: `radial-gradient(ellipse 46% 46% at 50% 50%, ${alpha(GOLD, 0.13)} 0%, ${alpha(GOLD, 0)} 100%)`,
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div aria-hidden="true" style={{ fontSize: isMobile ? 40 : 48, marginBottom: 16, lineHeight: 1 }}>☕</div>
              <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em", color: TEXT }}>
                Enjoying Syntaxx?
              </h2>
              <p style={{ color: MUTED, fontSize: 15, margin: "0 auto 30px", maxWidth: 450, lineHeight: 1.7 }}>
                Syntaxx is completely free. If it's saved you time or made your
                server better, a coffee keeps the lights on.
              </p>

              <ul style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "0 0 30px", padding: 0, listStyle: "none" }}>
                {["Credit card", "Apple Pay", "Google Pay", "PayPal"].map((m) => (
                  <li
                    key={m}
                    style={{
                      fontSize: 12, fontWeight: 600, color: GOLD,
                      backgroundColor: alpha(GOLD, 0.09),
                      border: `1px solid ${alpha(GOLD, 0.22)}`,
                      borderRadius: RADIUS.pill, padding: "5px 13px",
                    }}
                  >
                    {m}
                  </li>
                ))}
              </ul>

              <a
                href="https://www.buymeacoffee.com/syntaxx.lol"
                target="_blank"
                rel="noreferrer"
                className="btn-gold"
                aria-label="Buy me a coffee on Buy Me a Coffee (opens in a new tab)"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
                  color: INK, padding: isMobile ? "13px 28px" : "15px 38px",
                  borderRadius: RADIUS.md, fontSize: 16, fontWeight: 700,
                  textDecoration: "none", boxShadow: SHADOW.gold, letterSpacing: "-0.01em",
                }}
              >
                ☕ Buy me a coffee
              </a>

              {/* Was #3a3a3a on #121212 — about 1.6:1, and unreadable. */}
              <p style={{ color: SUBTLE, fontSize: 12.5, margin: "18px 0 0" }}>
                Secure payments via Buy Me a Coffee · Powered by Stripe
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
