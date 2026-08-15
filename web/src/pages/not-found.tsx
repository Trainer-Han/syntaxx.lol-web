import { Link } from "wouter";
import { Home, Terminal, Compass } from "lucide-react";
import logoUrl from "/syntaxx-logo.png";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  PAGE, INK, SURFACE, BORDER, TEXT, MUTED, SUBTLE,
  GOLD, GOLD_BRIGHT, PLATINUM, RADIUS, LAYOUT, GOLD_GRADIENT, SHADOW, alpha,
} from "@/theme";

/**
 * The 404 page.
 *
 * What shipped here was the scaffold's placeholder: a light-mode card on
 * `bg-gray-50` — the only page on a near-black site that flashed white — under
 * the message "Did you forget to add the page to the router?" That is a note
 * from one developer to another, addressed to a visitor who mistyped a URL and
 * has no idea what a router is.
 *
 * This page carries real traffic. GitHub Pages serves 404.html for every
 * unmatched path, and vite.config.ts emits the app shell as that file, so any
 * mistyped or stale link lands here.
 */
export default function NotFound() {
  const isMobile = useIsMobile();

  const destinations = [
    { href: "/", icon: Home, label: "Home", desc: "What Syntaxx does" },
    { href: "/commands", icon: Terminal, label: "Commands", desc: "All 100+ commands" },
  ];

  return (
    <div style={PAGE}>
      <a className="skip-link" href="#main">Skip to content</a>
      {/* "none", not "home": this is not the home page, so no nav item should
          be marked current, and the "Features" anchor must not appear — there
          is no #features section here for it to reach. */}
      <SiteNav current="none" />

      <main
        id="main"
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: `${isMobile ? 64 : 100}px ${isMobile ? LAYOUT.gutterMobile : LAYOUT.gutter}px ${isMobile ? 64 : 96}px`,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
            width: "min(520px, 100%)", height: 300, pointerEvents: "none", zIndex: 0,
            // Explicit ellipse radii so the glow fades out inside its own box
            // on both axes; the default farthest-corner sizing leaves colour
            // at the nearer edges and draws a visible rectangle.
            background: `radial-gradient(ellipse 46% 46% at 50% 45%, ${alpha(GOLD, 0.12)} 0%, ${alpha(GOLD, 0)} 100%)`,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <img
            src={logoUrl}
            alt=""
            width={68}
            height={68}
            // `margin: 0 auto` rather than text-align: Tailwind's preflight
            // makes images display:block, which text-align cannot centre.
            style={{ width: 68, height: 68, margin: "0 auto 26px", opacity: 0.85, filter: `drop-shadow(0 6px 24px ${alpha(GOLD, 0.26)})` }}
          />

          <p
            style={{
              fontSize: isMobile ? 64 : 84, fontWeight: 800, lineHeight: 1,
              margin: "0 0 14px", letterSpacing: "-0.05em",
              background: GOLD_GRADIENT,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent", color: GOLD,
            }}
          >
            404
          </p>

          <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em", color: TEXT }}>
            This page doesn't exist
          </h1>
          <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 420 }}>
            The link may be out of date, or the address may have a typo in it.
            Here's where to go instead.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12, marginBottom: 32, textAlign: "left",
            }}
          >
            {destinations.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="card-lift"
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: RADIUS.lg, padding: "16px 18px", textDecoration: "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 38, height: 38, flexShrink: 0, borderRadius: RADIUS.md,
                    backgroundColor: alpha(GOLD, 0.12),
                    border: `1px solid ${alpha(GOLD, 0.2)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <d.icon size={17} color={GOLD} />
                </span>
                <span>
                  <span style={{ display: "block", color: TEXT, fontWeight: 600, fontSize: 15 }}>{d.label}</span>
                  <span style={{ display: "block", color: SUBTLE, fontSize: 13, marginTop: 2 }}>{d.desc}</span>
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="/"
            className="btn-gold"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 100%)`,
              color: INK, padding: "14px 32px", borderRadius: RADIUS.md,
              fontSize: 15, fontWeight: 700, textDecoration: "none", boxShadow: SHADOW.gold,
            }}
          >
            <Compass size={16} aria-hidden="true" /> Back to home
          </Link>

          <p style={{ color: SUBTLE, fontSize: 13, marginTop: 28, marginBottom: 0 }}>
            Looking for the dashboard? It isn't part of{" "}
            <span style={{ color: PLATINUM }}>syntaxx.lol</span> — everything is
            configured from inside Discord with the setup commands.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
