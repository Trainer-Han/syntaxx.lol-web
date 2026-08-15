import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Menu, X } from "lucide-react";
import logoUrl from "/syntaxx-logo.png";
import { INVITE_URL } from "@/config";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  BORDER, TEXT, MUTED, GOLD, INK, LAYOUT, RADIUS, alpha,
} from "@/theme";

/**
 * The site header.
 *
 * Home, Commands, Privacy and Terms each carried their own copy of this, and
 * they had drifted apart: Home's was 64px tall and Commands' 60px, so the page
 * shifted vertically when you navigated between them. Privacy and Terms had a
 * different header again — a lone "Back" link with no invite button and no way
 * to reach Commands, which is a dead end at the exact moment a reader has
 * finished the legal text and might want to act.
 *
 * The mobile menu is a disclosure, and is wired as one: aria-expanded and
 * aria-controls so a screen reader announces its state, Escape to close, and a
 * click outside to dismiss. Previously it was a bare button toggling a
 * boolean, which announced nothing at all.
 */

/**
 * Which page the nav is sitting on. "none" is for pages that are not part of
 * the main set — the 404 — where no nav item should read as current and the
 * in-page "Features" anchor would point at a section that is not on the page.
 */
export type NavPage = "home" | "commands" | "legal" | "none";

interface NavLinkSpec {
  label: string;
  href: string;
  /** In-page anchors only make sense on the page that has the section. */
  anchor?: boolean;
}

export default function SiteNav({ current }: { current: NavPage }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // A menu that cannot be closed by Escape traps keyboard users, who have no
  // "tap outside" gesture available.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Widening the window past the breakpoint while the burger menu is open
  // otherwise leaves the panel stuck open under a desktop nav.
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  const links: NavLinkSpec[] = [
    { label: "Home", href: "/" },
    ...(current === "home" ? [{ label: "Features", href: "#features", anchor: true }] : []),
    { label: "Commands", href: "/commands" },
  ];

  const isActive = (l: NavLinkSpec) =>
    (l.href === "/" && current === "home") ||
    (l.href === "/commands" && current === "commands");

  const linkStyle = (active: boolean): React.CSSProperties => ({
    color: active ? TEXT : MUTED,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    padding: "6px 2px",
    position: "relative",
  });

  /** The active page gets a gold underline — position, not just weight. */
  const activeUnderline = (
    <span
      aria-hidden="true"
      style={{
        position: "absolute", left: 0, right: 0, bottom: -2, height: 2,
        borderRadius: 2, background: GOLD,
      }}
    />
  );

  return (
    <nav
      ref={navRef}
      style={{
        borderBottom: `1px solid ${BORDER}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        backgroundColor: alpha(INK, 0.82),
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: LAYOUT.maxWidth,
          margin: "0 auto",
          padding: `0 ${isMobile ? LAYOUT.gutterMobile : LAYOUT.gutter}px`,
          height: LAYOUT.navHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Link
          href="/"
          aria-label="Syntaxx — home"
          style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}
        >
          <img
            className="brand-mark"
            src={logoUrl}
            alt=""
            width={32}
            height={32}
            style={{ height: 32, width: 32, display: "block" }}
          />
          <span style={{ color: TEXT, fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
            syntaxx
          </span>
        </Link>

        <div style={{ display: "flex", gap: isMobile ? 8 : 24, alignItems: "center", flexShrink: 0 }}>
          {!isMobile &&
            links.map((l) =>
              l.anchor ? (
                <a key={l.label} href={l.href} className="link-quiet" style={linkStyle(false)}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="link-quiet" style={linkStyle(isActive(l))}>
                  {l.label}
                  {isActive(l) && activeUnderline}
                </Link>
              ),
            )}

          {isMobile && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-nav-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              style={{
                background: "none",
                border: `1px solid ${BORDER}`,
                borderRadius: RADIUS.md,
                padding: "7px 9px",
                color: TEXT,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          )}

          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="sx-btn sx-btn--primary sx-btn--sm"
            // "Invite" alone gives no clue where the link goes or that it
            // leaves the site. Screen readers announce this instead.
            aria-label="Invite Syntaxx to your Discord server (opens in a new tab)"
            // Geometry, colour and every interaction state come from sx-btn.
            // Only flex-shrink is set here, and only because the nav is the one
            // place this button sits in a row that can run out of room.
            style={{ flexShrink: 0 }}
          >
            Invite
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>

      {isMobile && open && (
        <div
          id="site-nav-menu"
          style={{
            borderTop: `1px solid ${BORDER}`,
            backgroundColor: alpha(INK, 0.98),
            padding: "10px 12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {links.map((l) => {
            const style: React.CSSProperties = {
              color: isActive(l) ? GOLD : TEXT,
              textDecoration: "none",
              fontSize: 15,
              fontWeight: isActive(l) ? 700 : 500,
              padding: "12px 10px",
              borderRadius: RADIUS.md,
            };
            return l.anchor ? (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={style}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)} style={style}>
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
