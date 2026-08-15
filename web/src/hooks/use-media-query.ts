import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query.
 *
 * This replaces four separate copies of the same idea. App.tsx had one of
 * these; Home and Commands each re-implemented it as a `resize` listener over
 * `window.innerWidth` — and at *different* breakpoints, 768 and 640, so the nav
 * collapsed to a burger at one width on the landing page and another on the
 * commands page.
 *
 * A resize listener is also the wrong tool: it fires on every frame of a drag
 * and re-renders the page each time, where matchMedia fires once when the
 * answer actually changes.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * The site's breakpoints, named once.
 *
 * `wide` is Tailwind's 2xl and gates the fixed ad strips — below it there is
 * not enough room beside the 1160px container for a 160px rail without it
 * overlapping the content.
 */
export const BREAKPOINT = {
  mobile: "(max-width: 47.99rem)",
  wide: "(min-width: 96rem)",
} as const;

/** True on phone-width screens. The one definition of "mobile" on the site. */
export const useIsMobile = () => useMediaQuery(BREAKPOINT.mobile);
