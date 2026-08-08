import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#2a2a2a";
const BORDER = "#383838";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";

export default function Terms() {
  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.95)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <span style={{ color: BORDER }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Terms of Service</span>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>Terms of Service</h1>
        <p style={{ color: MUTED, marginBottom: 48 }}>Last updated: June 2026</p>

        {[
          {
            title: "1. Acceptance of Terms",
            body: `By inviting Syntaxx to your Discord server or using the Syntaxx web dashboard, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the service.`,
          },
          {
            title: "2. Description of Service",
            body: `Syntaxx is a multi-purpose Discord bot providing moderation, economy, leveling, auto-moderation, and utility features for Discord servers. The accompanying dashboard allows server administrators to view bot statistics and manage certain bot settings.`,
          },
          {
            title: "3. User Responsibilities",
            body: `You agree not to use Syntaxx to:\n• Violate Discord's Terms of Service or Community Guidelines\n• Harass, threaten, or harm other users\n• Spam, raid, or disrupt other servers\n• Circumvent any security or access controls\n• Engage in any illegal activity\n\nYou are solely responsible for how you use Syntaxx in your server.`,
          },
          {
            title: "4. Bot Permissions",
            body: `Syntaxx requests only the permissions necessary to provide its features. You may limit permissions at any time through your server settings. We are not responsible for misuse of elevated permissions granted by server administrators.`,
          },
          {
            title: "5. Data Storage",
            body: `Syntaxx stores server-specific configuration data, moderation case logs, economy balances, leveling data, and server statistics. This data is used solely to provide bot functionality. See our Privacy Policy for details on data handling.`,
          },
          {
            title: "6. Service Availability",
            body: `We aim to keep Syntaxx available at all times but do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.`,
          },
          {
            title: "7. Blacklisting & Bans",
            body: `We reserve the right to blacklist users or servers from using Syntaxx at our sole discretion, including for violations of these terms or Discord's own policies.`,
          },
          {
            title: "8. Limitation of Liability",
            body: `Syntaxx is provided "as is" without any warranties. We are not liable for any damages arising from your use or inability to use the service, including but not limited to data loss, server disruption, or indirect damages.`,
          },
          {
            title: "9. Changes to Terms",
            body: `We may update these Terms of Service at any time. Continued use of Syntaxx after changes are made constitutes your acceptance of the new terms.`,
          },
          {
            title: "10. Contact",
            body: `For questions regarding these terms, join our support server at discord.gg/qQMqbVnWH8 or visit syntaxx.LOL.`,
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
