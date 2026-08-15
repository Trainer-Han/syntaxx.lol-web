import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "wouter";
import logoUrl from "/syntaxx-logo.png";
import "@/styles/sx-btn.css";
import "./not-found.css";

const IDLE_MESSAGES = [
  "No destination found.",
  "Route unresolved.",
  "Signal lost on this path.",
] as const;

const SCAN_SEQUENCE = [
  "Searching…",
  "Nothing here.",
  "Let's get you somewhere useful.",
] as const;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export default function NotFound() {
  const [, setLocation] = useLocation();
  const reducedMotion = usePrefersReducedMotion();
  const scanningRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const idleIndexRef = useRef(0);

  const [aiLabel, setAiLabel] = useState<string>(IDLE_MESSAGES[0]);
  const [scanning, setScanning] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      if (scanningRef.current) return;
      idleIndexRef.current = (idleIndexRef.current + 1) % IDLE_MESSAGES.length;
      setAiLabel(IDLE_MESSAGES[idleIndexRef.current] ?? IDLE_MESSAGES[0]);
    }, 4200);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current) window.clearTimeout(t);
      timersRef.current = [];
    };
  }, []);

  const runScan = useCallback(() => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];

    SCAN_SEQUENCE.forEach((msg, i) => {
      const id = window.setTimeout(() => setAiLabel(msg), i * 700);
      timersRef.current.push(id);
    });

    const done = window.setTimeout(() => {
      scanningRef.current = false;
      setScanning(false);
      setAiLabel(IDLE_MESSAGES[idleIndexRef.current] ?? IDLE_MESSAGES[0]);
    }, SCAN_SEQUENCE.length * 700 + 400);
    timersRef.current.push(done);
  }, []);

  const goHome = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (leaving) return;
      if (reducedMotion) {
        setLocation("/");
        return;
      }
      setLeaving(true);
      const id = window.setTimeout(() => setLocation("/"), 420);
      timersRef.current.push(id);
    },
    [leaving, reducedMotion, setLocation],
  );

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  }, [setLocation]);

  return (
    <main
      className={`nf-page${leaving ? " nf-leaving" : ""}`}
      aria-labelledby="nf-heading"
    >
      <div className="nf-atmosphere nf-enter-bg" aria-hidden="true">
        <div className="nf-glow nf-glow--a" />
        <div className="nf-glow nf-glow--b" />
        <div className="nf-glow nf-glow--c" />
        <div className="nf-scanline" />
        <div className="nf-grain" />
      </div>

      <Link href="/" className="nf-brand nf-enter-brand" aria-label="Syntaxx home">
        <img src={logoUrl} alt="" width={120} height={28} />
        <span>syntaxx.LOL</span>
      </Link>

      <div className="nf-stage">
        <div className="nf-orb nf-enter-1" aria-hidden="true">
          <div className="nf-orb__ring" />
          <span className="nf-orb__code">404</span>
        </div>

        <div className="nf-glass nf-enter-2">
          <div className="nf-glass__inner">
            <button
              type="button"
              className="nf-status nf-enter-3"
              onClick={runScan}
              aria-label="Rescan for this destination"
            >
              <span
                className={`nf-status__dot${scanning ? " nf-status__dot--scan" : ""}`}
                aria-hidden="true"
              />
              Signal lost · 404
            </button>

            <h1 id="nf-heading" className="nf-title nf-enter-4">
              We couldn&apos;t find that destination.
            </h1>

            <p className="nf-copy nf-enter-4">
              The page you&apos;re looking for may have moved, been removed, or never
              existed in the first place.
            </p>

            <div className="nf-ai nf-enter-5" aria-live="polite">
              <span className="nf-ai__orb" aria-hidden="true" />
              <span className="nf-ai__label">{aiLabel}</span>
            </div>

            <div className="nf-actions nf-enter-6">
              <a href="/" className="sx-btn sx-btn--primary" onClick={goHome}>
                Return Home
                <span className="sx-btn__arrow" aria-hidden="true">
                  →
                </span>
              </a>
              <button type="button" className="sx-btn sx-btn--ghost" onClick={goBack}>
                Go Back
              </button>
            </div>

            <p className="nf-footnote nf-enter-6">syntaxx · route unresolved</p>
          </div>
        </div>
      </div>
    </main>
  );
}
