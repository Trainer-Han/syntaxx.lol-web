import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#2a2a2a";
const BORDER = "#383838";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";

export default function Privacy() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.95)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <span style={{ color: BORDER }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Privacy Policy</span>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>Privacy Policy</h1>
        <p style={{ color: MUTED, marginBottom: 48 }}>Last updated: June 2026</p>

        {[
          {
            title: "1. What Data We Collect",
            body: `When you use Syntaxx, we may collect and store the following data:\n\n• Discord User IDs — to track economy balances, XP, infractions, and AFK status\n• Discord Server (Guild) IDs — to store per-server settings and configuration\n• Discord Channel & Role IDs — for setup commands (log channels, mute roles, etc.)\n• Message content — only when required by a specific feature (e.g. quote command, automod)\n• Moderation case data — logs of bans, kicks, mutes, and timeouts for audit purposes\n• Server join/leave timestamps — for server growth statistics shown on the dashboard`,
          },
          {
            title: "2. What Data We Do NOT Collect",
            body: `• We do not log or store message history beyond what is required by active features\n• We do not sell or share your data with third parties\n• We do not collect passwords, payment info, or personal contact details\n• We do not track users across servers`,
          },
          {
            title: "3. How We Use Data",
            body: `Data collected is used exclusively to:\n• Provide bot functionality within your server\n• Display aggregate statistics on the public dashboard (server count, member count)\n• Allow server administrators to manage bot settings through the dashboard\n\nWe do not use your data for advertising or profiling.`,
          },
          {
            title: "4. Dashboard & OAuth",
            body: `When you log in to the Syntaxx dashboard using Discord OAuth2, we receive:\n• Your Discord username and avatar (for display only)\n• A list of servers you manage\n\nThis data is stored only in your browser session and is never persisted to our database. Sessions expire automatically.`,
          },
          {
            title: "5. Data Retention",
            body: `• Server configuration data is retained as long as Syntaxx is in your server\n• When Syntaxx leaves a server, server-specific data (config, color roles) is automatically deleted\n• User data (economy, XP) persists until manually deleted by a server administrator or upon request\n• You can request deletion of your data by contacting us in our support server`,
          },
          {
            title: "6. Data Security",
            body: `We take reasonable technical measures to protect stored data. However, no system is completely secure. By using Syntaxx you acknowledge this inherent risk.`,
          },
          {
            title: "7. Third-Party Services",
            body: `Syntaxx is hosted on third-party infrastructure. Data may pass through these providers solely for the purpose of operating the service. We do not grant these providers access to your data beyond what is necessary for operation.`,
          },
          {
            title: "8. Children's Privacy",
            body: `Syntaxx is not directed at children under 13. If you are under 13, please do not use this service. We comply with Discord's minimum age requirements.`,
          },
          {
            title: "9. Your Rights",
            body: `You have the right to:\n• Request a copy of data we hold about you\n• Request deletion of your data\n• Opt out of non-essential data collection\n\nTo exercise these rights, contact us at discord.gg/qQMqbVnWH8.`,
          },
          {
            title: "10. Changes to This Policy",
            body: `We may update this Privacy Policy from time to time. Continued use of Syntaxx after changes constitutes acceptance of the updated policy.`,
          },
          {
            title: "11. Contact",
            body: `Questions about privacy? Join our support server: discord.gg/qQMqbVnWH8\nWebsite: syntaxx.LOL`,
          },
        ].map(section => (
          <div key={section.title} style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 32px", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>{section.title}</h2>
            <p style={{ color: MUTED, lineHeight: 1.75, fontSize: 15, whiteSpace: "pre-line", margin: 0 }}>{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
