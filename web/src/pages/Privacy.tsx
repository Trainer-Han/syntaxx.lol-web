import LegalPage, { type LegalSection } from "@/components/LegalPage";

/**
 * Sections 1, 3 and 4 used to describe a dashboard: server growth statistics
 * "shown on the dashboard", settings managed "through the dashboard", and a
 * whole section on what Discord OAuth2 login collects. None of that exists on
 * this deployment — the dashboard, the login and the API went with the Worker
 * when the site became a static build, so the policy was describing data
 * handling for a surface a visitor cannot reach. A privacy policy that
 * overstates what is collected is not a harmless leftover.
 *
 * Only claims that had become false were removed. Nothing new was promised.
 */
const sections: LegalSection[] = [
  {
    title: "1. What Data We Collect",
    body: `When you use Syntaxx, we may collect and store the following data:

• Discord User IDs — to track economy balances, XP, infractions, and AFK status
• Discord Server (Guild) IDs — to store per-server settings and configuration
• Discord Channel & Role IDs — for setup commands (log channels, mute roles, etc.)
• Message content — only when required by a specific feature (e.g. quote command, automod)
• Moderation case data — logs of bans, kicks, mutes, and timeouts for audit purposes
• Server join/leave timestamps — for the server statistics the bot reports in Discord`,
  },
  {
    title: "2. What Data We Do Not Collect",
    body: `• We do not log or store message history beyond what is required by active features
• We do not sell or share your data with third parties
• We do not collect passwords, payment info, or personal contact details
• We do not track users across servers`,
  },
  {
    title: "3. How We Use Data",
    body: `Data collected is used exclusively to provide bot functionality within your server — running commands, enforcing your moderation and automod settings, and keeping economy and leveling state.

We do not use your data for advertising or profiling.`,
  },
  {
    title: "4. This Website",
    body: `syntaxx.lol is a static site. It has no accounts, no login, and no server-side session, and it does not send anything you do here to a database.

The site displays third-party advertising (Google AdSense), which may set its own cookies and collect data under Google's privacy policy rather than ours. Google's practices are described at policies.google.com/privacy.`,
  },
  {
    title: "5. Data Retention",
    body: `• Server configuration data is retained as long as Syntaxx is in your server
• When Syntaxx leaves a server, server-specific data (config, color roles) is automatically deleted
• User data (economy, XP) persists until manually deleted by a server administrator or upon request
• You can request deletion of your data by contacting us in our support server`,
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
    body: `You have the right to:

• Request a copy of data we hold about you
• Request deletion of your data
• Opt out of non-essential data collection

To exercise these rights, contact us at discord.gg/qQMqbVnWH8.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Continued use of Syntaxx after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: "11. Contact",
    body: `Questions about privacy? Join our support server: discord.gg/qQMqbVnWH8
Website: syntaxx.lol`,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      intro="What Syntaxx stores, why it stores it, and how to get it removed."
      sections={sections}
    />
  );
}
