import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  PAGE, SURFACE, BORDER, TEXT, MUTED, SUBTLE, GOLD,
  RADIUS, LAYOUT, alpha,
} from "@/theme";

export interface LegalSection {
  title: string;
  body: string;
}

/**
 * Shared shell for Terms and Privacy.
 *
 * The two pages were byte-for-byte identical apart from their heading and
 * their array of sections, and both carried a stripped-down header with no
 * invite button and no route to Commands — a dead end at exactly the moment a
 * reader has finished the legal text and might want to act on it.
 *
 * Long-form reading gets its own treatment here: a narrower measure (about 70
 * characters, where the old full-width 800px cards ran to 100+), a table of
 * contents on wide screens, and section headings that are real anchors so a
 * clause can be linked to directly.
 */
export default function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  const isMobile = useIsMobile();

  const slug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div style={PAGE}>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteNav current="legal" />

      <main
        id="main"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: `${isMobile ? 44 : 68}px ${isMobile ? LAYOUT.gutterMobile : LAYOUT.gutter}px 0`,
        }}
      >
        <header style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.035em", color: TEXT }}>
            {title}
          </h1>
          <p style={{ color: MUTED, fontSize: 16, lineHeight: 1.7, margin: "0 0 14px", maxWidth: "62ch" }}>
            {intro}
          </p>
          <p style={{ color: SUBTLE, fontSize: 13, margin: 0 }}>Last updated: {updated}</p>
        </header>

        {/* Contents. Eleven numbered sections is enough that a reader looking
            for one clause should not have to scroll past the other ten. */}
        <nav
          aria-label="On this page"
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: RADIUS.lg,
            padding: isMobile ? "18px 20px" : "22px 26px",
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: SUBTLE, margin: "0 0 14px" }}>
            On this page
          </h2>
          <ol
            style={{
              margin: 0, padding: 0, listStyle: "none",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "9px 24px",
            }}
          >
            {sections.map((s) => (
              <li key={s.title}>
                <a
                  href={`#${slug(s.title)}`}
                  className="link-quiet"
                  style={{ color: MUTED, textDecoration: "none", fontSize: 14 }}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sections.map((section) => (
            <section
              key={section.title}
              id={slug(section.title)}
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: RADIUS.lg,
                padding: isMobile ? "24px 22px" : "28px 32px",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
                {section.title}
              </h2>
              {/* `whiteSpace: pre-line` keeps the bulleted lines the copy is
                  written with, without needing markdown in the data. */}
              <p
                style={{
                  color: MUTED, lineHeight: 1.75, fontSize: 15,
                  whiteSpace: "pre-line", margin: 0, maxWidth: "68ch",
                }}
              >
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p
          style={{
            marginTop: 28, marginBottom: 8, padding: "16px 20px",
            backgroundColor: alpha(GOLD, 0.05),
            border: `1px solid ${alpha(GOLD, 0.18)}`,
            borderRadius: RADIUS.md,
            color: MUTED, fontSize: 14, lineHeight: 1.7,
          }}
        >
          Questions about this document? Join the{" "}
          <a
            href="https://discord.gg/qQMqbVnWH8"
            target="_blank"
            rel="noreferrer"
            className="link-quiet"
            style={{ color: GOLD, fontWeight: 600 }}
          >
            support server
          </a>
          .
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
