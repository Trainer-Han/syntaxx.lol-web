import LegalPage, { type LegalSection } from "@/components/LegalPage";

/**
 * Sections 1 and 2 bound the reader to terms for "the Syntaxx web dashboard"
 * and described what that dashboard let administrators do. There is no
 * dashboard on this deployment — it went with the Worker when the site became
 * a static build. Both references now describe the website that actually
 * exists.
 *
 * Only claims that had become false were changed. No new obligations were
 * added in either direction.
 */
const sections: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    body: `By inviting Syntaxx to your Discord server or using the syntaxx.lol website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the service.`,
  },
  {
    title: "2. Description of Service",
    body: `Syntaxx is a multi-purpose Discord bot providing moderation, economy, leveling, auto-moderation, and utility features for Discord servers.

The syntaxx.lol website is informational: it documents the bot's commands and links to the invite. All bot configuration is done from within Discord, using the setup commands listed on the Commands page.`,
  },
  {
    title: "3. User Responsibilities",
    body: `You agree not to use Syntaxx to:

• Violate Discord's Terms of Service or Community Guidelines
• Harass, threaten, or harm other users
• Spam, raid, or disrupt other servers
• Circumvent any security or access controls
• Engage in any illegal activity

You are solely responsible for how you use Syntaxx in your server.`,
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
    body: `For questions regarding these terms, join our support server at discord.gg/qQMqbVnWH8 or visit syntaxx.lol.`,
  },
];

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 2026"
      intro="The rules for using the Syntaxx bot and this website."
      sections={sections}
    />
  );
}
