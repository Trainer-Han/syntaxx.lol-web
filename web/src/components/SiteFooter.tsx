import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import logoUrl from "/syntaxx-logo.png";
import { INVITE_URL } from "@/config";
import {
  BORDER_SUBTLE, MUTED, SUBTLE, TEXT, GOLD, LAYOUT, BRAND_SWEEP,
} from "@/theme";

const SUPPORT_URL = "https://discord.gg/qQMqbVnWH8";

/**
 * The site footer.
 *
 * Home's footer was a logo and two links set in #888 on #121212; Commands had
 * a different one set in #444, which measures about 2:1 against the page and
 * is effectively invisible. Privacy and Terms had no footer at all, so the
 * only way out of them was the browser's back button.
 *
 * Consistent, and legible: the smallest text here is SUBTLE, which clears
 * 5.5:1.
 */
export default function SiteFooter() {
  const linkStyle: React.CSSProperties = {
    color: MUTED,
    textDecoration: "none",
    fontSize: 14,
  };

  return (
    <footer style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, marginTop: 24 }}>
      {/* The logo's two colours, drawn as a hairline across the seam. */}
      <div aria-hidden="true" style={{ height: 1, background: BRAND_SWEEP, opacity: 0.55 }} />

      <div
        style={{
          maxWidth: LAYOUT.maxWidth,
          margin: "0 auto",
          padding: "44px 24px 36px",
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <Link
            href="/"
            aria-label="Syntaxx — home"
            style={{ display: "inline-flex", alignItems: "center", gap: 9, textDecoration: "none", marginBottom: 12 }}
          >
            <img
              className="brand-mark"
              src={logoUrl}
              alt=""
              width={28}
              height={28}
              style={{ height: 28, width: 28, display: "block" }}
            />
            <span style={{ color: TEXT, fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>
              syntaxx
            </span>
          </Link>
          <p style={{ color: SUBTLE, fontSize: 13, lineHeight: 1.65, margin: 0 }}>
            A Belgian Discord bot for moderation, economy, leveling and auto-mod.
          </p>
        </div>

        <nav aria-label="Footer" style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ color: TEXT, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Product
            </h2>
            <Link href="/commands" className="link-quiet" style={linkStyle}>Commands</Link>
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="link-quiet"
              style={{ ...linkStyle, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              Invite bot <ExternalLink size={12} aria-hidden="true" />
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="link-quiet"
              style={{ ...linkStyle, display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              Support server <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ color: TEXT, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Legal
            </h2>
            <Link href="/terms" className="link-quiet" style={linkStyle}>Terms of Service</Link>
            <Link href="/privacy" className="link-quiet" style={linkStyle}>Privacy Policy</Link>
          </div>
        </nav>
      </div>

      <div
        style={{
          maxWidth: LAYOUT.maxWidth,
          margin: "0 auto",
          padding: "18px 24px 32px",
          borderTop: `1px solid ${BORDER_SUBTLE}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: SUBTLE, fontSize: 12.5 }}>
          © {new Date().getFullYear()} Syntaxx. Not affiliated with Discord Inc.
        </span>
        <span style={{ color: SUBTLE, fontSize: 12.5 }}>
          <span style={{ color: GOLD }}>syntaxx</span>.lol
        </span>
      </div>
    </footer>
  );
}
