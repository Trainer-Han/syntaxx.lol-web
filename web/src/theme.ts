/**
 * The brand, in one place.
 *
 * Every page used to declare its own ACCENT/BG/CARD/BORDER/TEXT/MUTED consts,
 * and they had already drifted: Home's card was #2a2a2a on a #383838 border,
 * Commands' was #1e1e1e on #2e2e2e. Same role, different value, no way to tell
 * which was intended. Anything a page needs to colour comes from here now.
 *
 * The palette is taken from the logo (web/public/syntaxx-logo.png): a gold and
 * a platinum glass diamond overlapping on a near-black tile. The old accent,
 * #B8A05B, was a muted olive that read as dull beside the mark, and the
 * platinum half of the logo appeared nowhere in the UI at all.
 *
 * Contrast is not decorative here — every value below is checked against INK
 * and annotated with its ratio. WCAG AA wants 4.5:1 for body text and 3:1 for
 * large text and UI boundaries. The values that used to fail (#444 for command
 * usage strings and footer links, #555, #3a3a3a) are gone; they measured about
 * 2:1, which is legible on a designer's monitor and invisible on a phone in
 * daylight.
 */
import type { CSSProperties } from "react";

// ── Surfaces ────────────────────────────────────────────────────────────────
/** Page background. Matches the logo tile and the manifest's theme colour. */
export const INK = "#0A0A0C";
/** Raised surface: cards, the search field, inert panels. */
export const SURFACE = "#131318";
/** Raised one step further: hovered cards, nested wells. */
export const SURFACE_2 = "#1A1A21";
/** Default hairline. */
export const BORDER = "#26262F";
/** Hairline for dividers that should recede rather than delineate. */
export const BORDER_SUBTLE = "#1D1D24";

// ── Type ────────────────────────────────────────────────────────────────────
/** Primary text. 18.4:1 on INK. */
export const TEXT = "#F5F5F7";
/** Secondary text: descriptions, body copy. 7.4:1 on INK. */
export const MUTED = "#A0A0AE";
/** Tertiary text: usage strings, counts, legal fine print. 5.5:1 on INK. */
export const SUBTLE = "#86868F";

// ── Brand accents ───────────────────────────────────────────────────────────
/** The logo's gold diamond. 10.4:1 against INK, so INK-on-GOLD buttons pass. */
export const GOLD = "#D8B96B";
/** The specular highlight where the two diamonds cross. Gradient end-stop. */
export const GOLD_BRIGHT = "#F2DCA6";
/** Gold in shadow. For gradient start-stops and pressed states. */
export const GOLD_DEEP = "#A98B45";
/** The logo's platinum diamond — the second accent the site never used. */
export const PLATINUM = "#C9CDD6";
/** Platinum in shadow. */
export const PLATINUM_DEEP = "#8A909C";

// ── Semantic ────────────────────────────────────────────────────────────────
export const GREEN = "#5BE896";
export const RED = "#F0685C";
export const ORANGE = "#F0913F";
export const BLURPLE = "#7B85F5";

/**
 * Category and feature hues.
 *
 * These were picked for a light UI originally (#c0392b, #2980b9, #16a085) and
 * carried straight over onto near-black, where several of them dropped under
 * 3:1 — the category labels in Commands are set in their own colour, so a dim
 * hue makes the label itself unreadable, not just tinted. Each is lifted here
 * until it clears 4.5:1 on INK while keeping its original identity.
 */
export const HUE = {
  general: BLURPLE,
  moderation: RED,
  setup: "#4FA8E8",
  toggles: "#B57BE0",
  leveling: "#3FD1B8",
  casino: "#F5CE4A",
  games: GREEN,
  context: "#B57BE0",
  pro: GOLD,
  music: "#4ADE80",
  utility: ORANGE,
  fun: "#3FD1B8",
} as const;

// ── Alpha helpers ───────────────────────────────────────────────────────────
/**
 * `alpha(GOLD, 0.12)` instead of `GOLD + "1f"`.
 *
 * The hex-suffix trick was used throughout and is a quiet trap: `ACCENT + "20"`
 * is 12.5% opacity, not 20%, and `cat.color + "18"` is 9%. Two tints that were
 * meant to match visibly did not.
 */
export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16,
  );
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// ── Elevation ───────────────────────────────────────────────────────────────
/**
 * Shadows on a near-black page cannot be black — there is nothing darker to
 * cast onto. These lean on a tinted ambient spread plus a light top edge,
 * which is what actually reads as "raised" in a dark UI.
 */
export const SHADOW = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "0 4px 16px rgba(0,0,0,0.45)",
  lg: "0 12px 40px rgba(0,0,0,0.5)",
  gold: `0 8px 32px ${alpha(GOLD, 0.22)}`,
} as const;

// ── Rhythm ──────────────────────────────────────────────────────────────────
/** Corner radii, as a scale rather than a per-component guess (12/14/20/24). */
export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;

/** Page gutter and max width, so every page's container agrees. */
export const LAYOUT = {
  maxWidth: 1160,
  gutter: 24,
  gutterMobile: 18,
  navHeight: 64,
} as const;

export const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";
export const FONT_MONO = "'Fira Code', 'Fira Mono', ui-monospace, monospace";

/** The gold text gradient used on headline words. */
export const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 45%, ${GOLD_DEEP} 100%)`;

/**
 * The logo's two diamonds, as a sweep: gold into platinum. Used for hairline
 * accents and the hero rule so the mark's second colour appears in the UI.
 */
export const BRAND_SWEEP = `linear-gradient(90deg, ${alpha(GOLD, 0)} 0%, ${GOLD} 35%, ${PLATINUM} 65%, ${alpha(PLATINUM, 0)} 100%)`;

/** Shared page shell style, so the four pages cannot disagree about basics. */
export const PAGE: CSSProperties = {
  backgroundColor: INK,
  color: TEXT,
  minHeight: "100vh",
  fontFamily: FONT_SANS,
};
