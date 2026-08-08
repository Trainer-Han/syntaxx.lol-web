import { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: string;
  style?: React.CSSProperties;
}

/**
 * Google AdSense display ad unit.
 *
 * How to get a slot ID:
 *   AdSense dashboard → Ads → By ad unit → Display ads → Create new ad unit
 *   Copy the "data-ad-slot" value (10-digit number) and pass it as the `slot` prop.
 */
export default function AdBanner({ slot, style }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet (e.g. in dev / ad-blocker present) — silently ignore
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client="ca-pub-8559400574092394"
      data-ad-slot={slot}
      data-ad-format="vertical"
      data-full-width-responsive="false"
    />
  );
}
