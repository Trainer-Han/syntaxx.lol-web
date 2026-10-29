import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Shield, Wrench, Gamepad2, Sparkles, Terminal,
  Search, ExternalLink, ChevronRight, MousePointerClick,
  Image, BarChart2, Coins, Globe, SlidersHorizontal, X,
} from "lucide-react";
import { INVITE_URL } from "@/config";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  PAGE, SURFACE, SURFACE_2, BORDER, BORDER_SUBTLE,
  TEXT, MUTED, SUBTLE, GOLD, HUE, GREEN, ORANGE, RED,
  RADIUS, LAYOUT, FONT_MONO, GOLD_GRADIENT, alpha,
} from "@/theme";

const ACCENT = GOLD;

type Tag = "admin" | "pro" | "prefix";

interface Command {
  name:    string;
  desc:    string;
  usage?:  string;
  tags?:   Tag[];
}
interface Category {
  id:       string;
  label:    string;
  icon:     React.ReactNode;
  color:    string;
  badge?:   string;
  commands: Command[];
}

const categories: Category[] = [
  /* ─────────────────── GENERAL ─────────────────── */
  {
    id: "general", label: "General", color: HUE.general,
    icon: <Globe size={15} />,
    commands: [
      { name: "/help",              desc: "Open the interactive help menu — browse all command categories from one place",                    usage: "/help" },
      { name: "/syntaxx",          desc: "View live bot statistics: uptime, ping, server count, member count, and a server growth chart",    usage: "/syntaxx" },
      { name: "/afk",              desc: "Set your AFK status with an optional reason — bot prefixes [AFK] to your nickname",               usage: "/afk [reason]" },
      { name: "/contact",          desc: "Open a modal form to send a message directly to the Syntaxx developer",                           usage: "/contact" },
      { name: "/request-blacklist",desc: "Request that a user be globally blacklisted — notifies server owner and developer with proof",     usage: "/request-blacklist <user> [reason] [proof]" },
      { name: "/wallet",           desc: "View your global chip balance and money balance across all servers",                               usage: "/wallet [@user]" },
      { name: "/server",           desc: "View all server configuration settings — moderation, logging, toggles, and more",                 usage: "/server",               tags: ["admin"] },
      { name: "/staff",            desc: "Display all staff members by role with their current online/idle/DND/offline status",             usage: "/staff" },
      { name: "/qr",               desc: "Generate a QR code from any text or URL and receive it as an image",                              usage: "/qr <text>" },
      { name: "/removebg",         desc: "Remove the background from any uploaded PNG, JPG, or WebP image",                                 usage: "/removebg <image>" },
      { name: "/checkmycar",       desc: "Look up basic vehicle information (make, model, year, fuel, engine) using a VIN number",           usage: "/checkmycar <vin>" },
    ],
  },

  /* ─────────────────── MODERATION ─────────────────── */
  {
    id: "moderation", label: "Moderation", color: HUE.moderation,
    icon: <Shield size={15} />,
    commands: [
      { name: "/ban",          desc: "Ban a member from the guild by mention or user ID",                                              usage: "/ban [user] [userid] [reason]",  tags: ["admin"] },
      { name: "/kick",         desc: "Kick a member from the server",                                                                  usage: "/kick [user] [reason]",          tags: ["admin"] },
      { name: "/mute",         desc: "Mute a member permanently using the configured muted role",                                      usage: "/mute [user] [userid] [reason]", tags: ["admin"] },
      { name: "/unmute",       desc: "Remove the muted role from a member to restore their ability to speak",                          usage: "/unmute [user]",                 tags: ["admin"] },
      { name: "/timeout",      desc: "Temporarily timeout a user for a set duration",                                                  usage: "/timeout <user> <duration>",     tags: ["admin"] },
      { name: "/warn",         desc: "Issue a formal warning to a member and log it to their infraction history",                      usage: "/warn <user> [reason]",          tags: ["admin"] },
      { name: "/view-case",    desc: "View a specific moderation case by its case number",                                             usage: "/view-case <number>",            tags: ["admin"] },
      { name: "/view-all-cases",desc: "List all moderation cases logged in this server",                                              usage: "/view-all-cases",                tags: ["admin"] },
      { name: "/clear",        desc: "Bulk delete messages from a channel",                                                            usage: "/clear <amount>",                tags: ["admin"] },
      { name: "/purge",        desc: "Delete messages from a user across all server channels in the last 24 hours",                    usage: "/purge [target] [identifier]",   tags: ["admin"] },
      { name: "/add-case",     desc: "Manually add a moderation case with a number and description",                                  usage: "/add-case <number> <text>",      tags: ["admin"] },
      { name: "/delete-case",  desc: "Delete a moderation case by its number",                                                        usage: "/delete-case <number>",          tags: ["admin"] },
      { name: "/nickname",     desc: "Change a member's nickname",                                                                     usage: "/nickname <member> [nickname]",  tags: ["admin"] },
      { name: "/say",          desc: "Send a message or embed via the bot to a specified channel",                                     usage: "/say <channel>",                 tags: ["admin"] },
      { name: "/dm-member",    desc: "Send a structured DM embed to a member via the bot",                                            usage: "/dm-member <user> <title> …",    tags: ["admin"] },
      { name: "/dupe-role",    desc: "Duplicate a role and place it directly above the original",                                     usage: "/dupe-role <role>",              tags: ["admin"] },
    ],
  },

  /* ─────────────────── SETUP ─────────────────── */
  {
    id: "setup", label: "Setup", color: HUE.setup,
    icon: <Wrench size={15} />,
    commands: [
      { name: "/setup-memberlog",              desc: "Configure the channel where member join/leave events are logged, plus auto-roles",          usage: "/setup-memberlog",                        tags: ["admin"] },
      { name: "/setup-cleared-log-channel",    desc: "Set the channel where bulk-cleared message logs are sent",                                  usage: "/setup-cleared-log-channel <channel>",    tags: ["admin"] },
      { name: "/setup-casino-channel",         desc: "Set the channel where casino commands are allowed to be used",                              usage: "/setup-casino-channel <channel>",          tags: ["admin"] },
      { name: "/setup-chipleaderboard",        desc: "Spawn a live chip leaderboard embed that updates automatically in the current channel",      usage: "/setup-chipleaderboard",                  tags: ["admin"] },
      { name: "/setup-color-roles",            desc: "Set up the pastel colour reaction roles panel for members to self-assign a color role",     usage: "/setup-color-roles",                      tags: ["admin"] },
      { name: "/setup-guessword-announcement", desc: "Set a channel where Guess the Word game winners are announced",                             usage: "/setup-guessword-announcement <channel>", tags: ["admin"] },
      { name: "/setup-mute-role",              desc: "Define which role is applied when a member is muted",                                       usage: "/setup-mute-role <role>",                 tags: ["admin"] },
      { name: "/setup-modlogs",                desc: "Set the channel where moderation actions (bans, kicks, mutes) are logged",                  usage: "/setup-modlogs <channel>",                tags: ["admin"] },
      { name: "/setup-message-logs",           desc: "Set a channel where edited and deleted messages are logged",                                usage: "/setup-message-logs <channel>",           tags: ["admin"] },
      { name: "/setup-leaderboard",            desc: "Create a live chip leaderboard in the current channel",                                     usage: "/setup-leaderboard",                      tags: ["admin"] },
      { name: "/setup-verification-channel",   desc: "Set up the channel where new members verify themselves",                                    usage: "/setup-verification-channel <channel>",   tags: ["admin"] },
      { name: "/setup-verification-role",      desc: "Set the role given to members after they successfully verify",                              usage: "/setup-verification-role <role>",         tags: ["admin"] },
      { name: "/setup-voicechannel-system",    desc: "Enable the temporary voice channel system — members create their own voice channels on join",usage: "/setup-voicechannel-system",              tags: ["admin"] },
      { name: "/rename",                       desc: "Change the bot's nickname in this server",                                                  usage: "/rename <new_name>",                      tags: ["admin"] },
    ],
  },

  /* ─────────────────── TOGGLES ─────────────────── */
  {
    id: "toggles", label: "Toggles", color: HUE.toggles,
    icon: <SlidersHorizontal size={15} />,
    commands: [
      { name: "/toggle-levels",               desc: "Enable or disable the XP leveling system for this server",                         usage: "/toggle-levels",               tags: ["admin"] },
      { name: "/toggle-cat-pics",             desc: "Toggle automatic cat picture responses in the server",                             usage: "/toggle-cat-pics",             tags: ["admin"] },
      { name: "/toggle-car-commands",         desc: "Enable or disable the BMW/car themed commands for this server",                    usage: "/toggle-car-commands",         tags: ["admin"] },
      { name: "/toggle-quote-commands",       desc: "Enable or disable the quote system that lets members quote messages",              usage: "/toggle-quote-commands",       tags: ["admin"] },
      { name: "/toggle-anti-multi-attachment",desc: "Enable or disable protection against spam attachments per message",               usage: "/toggle-anti-multi-attachment",tags: ["admin"] },
    ],
  },

  /* ─────────────────── LEVELING ─────────────────── */
  {
    id: "leveling", label: "Leveling", color: HUE.leveling,
    icon: <BarChart2 size={15} />,
    commands: [
      { name: "/level",            desc: "View your current level, XP, and progress bar as a rendered canvas image — optionally check another user",  usage: "/level [@user]" },
      { name: "/level-leaderboard",desc: "Show the top 7 highest-XP users in this server with their levels and message counts as a canvas image",     usage: "/level-leaderboard" },
    ],
  },

  /* ─────────────────── CASINO ─────────────────── */
  {
    id: "casino", label: "Casino", color: HUE.casino,
    icon: <Coins size={15} />,
    commands: [
      { name: "/blackjack",   desc: "Play Blackjack against the dealer — hit or stand to reach 21 without going bust",                       usage: "/blackjack <bet>" },
      { name: "/roulette",    desc: "Spin the roulette wheel — bet on red, black, a number (0–36), a dozen, column, even, or odd",           usage: "/roulette <bet> <choice>" },
      { name: "/slot",        desc: "Spin the slot machine — match symbols to multiply your bet up to 10×",                                  usage: "/slot <bet>" },
      { name: "/mines",       desc: "Click tiles to reveal gems and grow your multiplier — cash out before hitting a bomb to keep your winnings", usage: "/mines <bet> [bombs]" },
      { name: "/claim",       desc: "Claim your free daily chips (1,000 per day; 1,500 with Server Boost)",                                  usage: "/claim" },
      { name: "/steal-chips", desc: "Attempt to steal 10% of another user's chips — 10% success chance, 12h cooldown, fine on failure",     usage: "/steal-chips <@user>" },
    ],
  },

  /* ─────────────────── GAMES ─────────────────── */
  {
    id: "games", label: "Games", color: GREEN,
    icon: <Gamepad2 size={15} />,
    commands: [
      { name: "/guessword",             desc: "Start a Guess the Word game — set a word and let members guess for chips and XP",     usage: "/guessword <word>" },
      { name: "/guessword-leaderboard", desc: "Show the all-time Guess the Word leaderboard for this server",                        usage: "/guessword-leaderboard" },
      { name: "/stop-guesswordgame",    desc: "Stop the currently active Guess the Word game (staff only)",                          usage: "/stop-guesswordgame",  tags: ["admin"] },
    ],
  },

  /* ─────────────────── CONTEXT MENU ─────────────────── */
  {
    id: "context", label: "Context Menu", color: HUE.context,
    badge: "Right-click",
    icon: <MousePointerClick size={15} />,
    commands: [
      { name: "Ban",            desc: "Right-click a member → Apps → Ban them instantly without typing a command",   tags: ["admin"] },
      { name: "Kick",           desc: "Right-click a member → Apps → Kick them instantly without typing a command",  tags: ["admin"] },
      { name: "Purge Messages", desc: "Right-click a message → Apps → Purge all messages from that user",           tags: ["admin"] },
      { name: "Quote Message",  desc: "Right-click a message → Apps → Quote it in the current channel" },
    ],
  },

  /* ─────────────────── PRO ─────────────────── */
  {
    id: "pro", label: "Pro Features", color: ACCENT,
    icon: <Sparkles size={15} />,
    commands: [
      { name: "/custom-command add",    desc: "Add a new custom command — set a trigger word and the bot replies automatically", usage: "/custom-command add <trigger> <response>", tags: ["pro"] },
      { name: "/custom-command list",   desc: "List all custom commands set up in this server",                                 usage: "/custom-command list",                    tags: ["pro"] },
      { name: "/custom-command remove", desc: "Remove an existing custom command by trigger",                                   usage: "/custom-command remove <trigger>",         tags: ["pro"] },
    ],
  },

  /* ─────────────────── MUSIC (PRO) ─────────────────── */
  {
    id: "music", label: "Music (Pro)", color: HUE.music,
    badge: "taxx!",
    icon: <Coins size={15} />,
    commands: [
      { name: "taxx!play",       desc: "Play a song or playlist from YouTube, Spotify, or SoundCloud — adds to queue if already playing",      usage: "taxx!play <song name or URL>", tags: ["pro", "prefix"] },
      { name: "taxx!pause",      desc: "Pause the current song",                                                                                usage: "taxx!pause",                  tags: ["pro", "prefix"] },
      { name: "taxx!resume",     desc: "Resume a paused song",                                                                                  usage: "taxx!resume",                 tags: ["pro", "prefix"] },
      { name: "taxx!skip",       desc: "Skip the current song and play the next one in the queue",                                              usage: "taxx!skip",                   tags: ["pro", "prefix"] },
      { name: "taxx!stop",       desc: "Stop playback and clear the entire queue — bot leaves the voice channel",                              usage: "taxx!stop",                   tags: ["pro", "prefix"] },
      { name: "taxx!queue",      desc: "Show the current song queue with up to 10 upcoming tracks",                                             usage: "taxx!queue",                  tags: ["pro", "prefix"] },
      { name: "taxx!np",         desc: "Show the currently playing song with a progress bar and duration",                                      usage: "taxx!np",                     tags: ["pro", "prefix"] },
      { name: "taxx!volume",     desc: "Set the playback volume from 1 to 200%",                                                                usage: "taxx!volume <1-200>",         tags: ["pro", "prefix"] },
      { name: "taxx!shuffle",    desc: "Shuffle all songs in the current queue randomly",                                                       usage: "taxx!shuffle",                tags: ["pro", "prefix"] },
      { name: "taxx!loop",       desc: "Cycle through loop modes — Off → Loop Song → Loop Queue",                                              usage: "taxx!loop",                   tags: ["pro", "prefix"] },
      { name: "taxx!join",       desc: "Make the bot join your current voice channel",                                                          usage: "taxx!join",                   tags: ["pro", "prefix"] },
      { name: "taxx!leave",      desc: "Make the bot leave the voice channel and clear the queue",                                             usage: "taxx!leave",                  tags: ["pro", "prefix"] },
      { name: "taxx!remove",     desc: "Remove a specific song from the queue by its position number",                                         usage: "taxx!remove <position>",      tags: ["pro", "prefix"] },
    ],
  },

  /* ─────────────────── PREFIX: MODERATION ─────────────────── */
  {
    id: "prefix-mod", label: "Prefix · Moderation", color: HUE.moderation,
    badge: "taxx!",
    icon: <Shield size={15} />,
    commands: [
      { name: "taxx!ban",         desc: "Ban a user with optional reason and DM notification",                    usage: "taxx!ban <@user|id> [reason] [dm:true/false]",      tags: ["admin", "prefix"] },
      { name: "taxx!kick",        desc: "Kick a user with optional reason and DM notification",                   usage: "taxx!kick <@user|id> [reason] [dm:true/false]",     tags: ["admin", "prefix"] },
      { name: "taxx!mute",        desc: "Permanently mute a member using the configured muted role",              usage: "taxx!mute <@user|id|name> [reason] [dm:true/false]",tags: ["admin", "prefix"] },
      { name: "taxx!unmute",      desc: "Remove the muted role from a member to restore their ability to speak",  usage: "taxx!unmute <@user|id|name> [dm:true/false]",       tags: ["admin", "prefix"] },
      { name: "taxx!unban",       desc: "Unban a previously banned user by their ID",                             usage: "taxx!unban <userID> [reason]",                      tags: ["admin", "prefix"] },
      { name: "taxx!infractions", desc: "View a member's full infraction history — timeouts and permanent mutes", usage: "taxx!infractions <@user|id|username>",              tags: ["admin", "prefix"] },
      { name: "taxx!settimeouts", desc: "Manually set a member's stored timeout count to any number",             usage: "taxx!settimeouts <@user|id|username> <number>",     tags: ["admin", "prefix"] },
    ],
  },

  /* ─────────────────── PREFIX: SETUP ─────────────────── */
  {
    id: "prefix-setup", label: "Prefix · Setup", color: HUE.setup,
    badge: "taxx!",
    icon: <Wrench size={15} />,
    commands: [
      { name: "taxx!automod",               desc: "Enable, disable, or configure the automod system — manage banned words and channel/user/role exemptions", usage: "taxx!automod <on|off|status|word|except>",             tags: ["admin", "prefix"] },
      { name: "taxx!perms",                 desc: "Grant or revoke command access by role, user, or channel — fine-grained permission control",              usage: "taxx!perms <allow|deny|list|reset> <command> -r/-u/-c <value>", tags: ["admin", "prefix"] },
      { name: "taxx!setupwelcomeleave",     desc: "Configure channels for automatic welcome and goodbye messages",                                            usage: "taxx!setupwelcomeleave <welcome|leave> <#channel|delete>", tags: ["admin", "prefix"] },
      { name: "taxx!setjam",               desc: "Save a Spotify Jam link so members can use taxx!jam to retrieve it with a QR code",                       usage: "taxx!setjam <spotify-jam-url>",                        tags: ["admin", "prefix"] },
      { name: "taxx!setuprestart",          desc: "Post a bot status embed with a restart button in the current channel",                                     usage: "taxx!setuprestart",                                    tags: ["admin", "prefix"] },
      { name: "taxx!stafflist",             desc: "Add or remove roles that count as staff roles on this server",                                             usage: "taxx!stafflist <add|remove> @role …",                  tags: ["admin", "prefix"] },
      { name: "taxx!setantimultiattachment",desc: "Set the maximum number of attachments or links allowed per message; use 'false' to disable",              usage: "taxx!setantimultiattachment <number|false>",            tags: ["admin", "prefix"] },
      { name: "taxx!role",                  desc: "Add, remove, or create roles — supports bulk operations across all server members",                        usage: "taxx!role <add|take|create> <@user|ALL> <@role>",      tags: ["admin", "prefix"] },
      { name: "taxx!adminantiraid",         desc: "Add or remove users and roles from the anti-raid exception list",                                          usage: "taxx!adminantiraid <allow|deny> <@user|@role|ID>",     tags: ["admin", "prefix"] },
    ],
  },

  /* ─────────────────── PREFIX: UTILITY ─────────────────── */
  {
    id: "prefix-utility", label: "Prefix · Utility", color: ORANGE,
    badge: "taxx!",
    icon: <Image size={15} />,
    commands: [
      { name: "taxx!avatar",       desc: "Display a member's avatar with download links in PNG, JPG, and WEBP formats",                             usage: "taxx!avatar [@user|id]",               tags: ["prefix"] },
      { name: "taxx!banner",       desc: "Display a member's Discord profile banner with download links, or show their accent colour if no banner", usage: "taxx!banner [@user|id]",              tags: ["prefix"] },
      { name: "taxx!steal",        desc: "Copy emojis or stickers from a replied message and add them to this server",                              usage: "taxx!steal <emojis|stickers>",         tags: ["admin", "prefix"] },
      { name: "taxx!uploademojis", desc: "Bulk upload emojis to the server from a ZIP file attachment — skips duplicates and oversized files",      usage: "taxx!uploademojis (attach .zip file)",  tags: ["admin", "prefix"] },
      { name: "taxx!syncrole",     desc: "Link a role from the Application server to a corresponding role in the Main server",                      usage: "taxx!syncrole @appRole @mainRole",      tags: ["admin", "prefix"] },
      { name: "taxx!altfind",      desc: "Advanced alt account detector — compares usernames, avatars, join dates, and roles to produce a suspicion score", usage: "taxx!altfind @user",             tags: ["admin", "prefix"] },
    ],
  },

  /* ─────────────────── PREFIX: FUN ─────────────────── */
  {
    id: "prefix-fun", label: "Prefix · Fun", color: HUE.fun,
    badge: "taxx!",
    icon: <Gamepad2 size={15} />,
    commands: [
      { name: "taxx!russian",            desc: "Start or join a Russian Roulette game — bet chips and survive the bullet to win the pot",     usage: "taxx!russian <bet>",          tags: ["prefix"] },
      { name: "taxx!russianleaderboard", desc: "Show the Russian Roulette win leaderboard for this server",                                   usage: "taxx!russianleaderboard",     tags: ["prefix"] },
      { name: "taxx!jam",                desc: "Retrieve the current Spotify Jam link and display it with a scannable QR code",               usage: "taxx!jam",                    tags: ["prefix"] },
      { name: "taxx!editgif",            desc: "Add top or bottom caption text to a GIF by replying to a message that contains one",          usage: "taxx!editgif toptext … bottomtext …", tags: ["admin", "prefix"] },
    ],
  },
];

const ALL_ID = "all";

/**
 * The badges are colour-coded, but colour is never the only signal — each one
 * also carries its own word. A red and an orange pill of identical text would
 * be indistinguishable to a red-green colourblind reader, which is roughly one
 * man in twelve.
 */
function TagBadge({ tag }: { tag: Tag }) {
  const styles: Record<Tag, { label: string; color: string }> = {
    admin:  { label: "ADMIN",  color: RED },
    pro:    { label: "PRO",    color: GOLD },
    prefix: { label: "PREFIX", color: ORANGE },
  };
  const { label, color } = styles[tag];
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
        backgroundColor: alpha(color, 0.12),
        color,
        border: `1px solid ${alpha(color, 0.28)}`,
        borderRadius: RADIUS.sm,
        padding: "2px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export default function Commands() {
  const [activeCat, setActiveCat] = useState(ALL_ID);
  const [query,     setQuery]     = useState("");
  const isMobile = useIsMobile();
  const still = useReducedMotion();

  // The catalogue is the whole catalogue now. Owner-added custom commands used
  // to be merged in from /api/commands/custom, which a static build cannot
  // reach — the list below is what ships.
  const allCategories = categories;

  const slashCount  = useMemo(() => allCategories.filter(c => !c.id.startsWith("prefix")).reduce((a, c) => a + c.commands.length, 0), [allCategories]);
  const prefixCount = useMemo(() => allCategories.filter(c => c.id.startsWith("prefix")).reduce((a, c) => a + c.commands.length, 0), [allCategories]);
  const totalCommands = slashCount + prefixCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCategories
      .filter(c => activeCat === ALL_ID || c.id === activeCat)
      .map(c => ({
        ...c,
        commands: c.commands.filter(cmd =>
          !q || cmd.name.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)
        ),
      }))
      .filter(c => c.commands.length > 0);
  }, [allCategories, activeCat, query]);

  /** How many commands survived the current filter, for the live region. */
  const resultCount = useMemo(
    () => filtered.reduce((a, c) => a + c.commands.length, 0),
    [filtered],
  );

  const isPrefix = (id: string) => id.startsWith("prefix");

  const gutter = isMobile ? LAYOUT.gutterMobile : LAYOUT.gutter;

  return (
    <div style={PAGE}>
      <a className="skip-link" href="#main">Skip to content</a>
      <SiteNav current="commands" />

      <main id="main" style={{ maxWidth: LAYOUT.maxWidth, margin: "0 auto", padding: `${isMobile ? 48 : 72}px ${gutter}px 0` }}>
        <motion.div
          initial={still ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={still ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: still ? 0.2 : 0.5 }}
        >
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 44 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                backgroundColor: alpha(GOLD, 0.09),
                border: `1px solid ${alpha(GOLD, 0.26)}`,
                borderRadius: RADIUS.pill, padding: "6px 15px", marginBottom: 20,
                fontSize: 12.5, color: GOLD, fontWeight: 600,
              }}
            >
              <Terminal size={12} aria-hidden="true" />
              {totalCommands} commands — {slashCount} slash · {prefixCount} prefix
            </div>
            <h1 style={{ fontSize: isMobile ? 34 : 52, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.035em", color: TEXT }}>
              All{" "}
              <span
                style={{
                  background: GOLD_GRADIENT,
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  WebkitTextFillColor: "transparent", color: GOLD,
                }}
              >
                Commands
              </span>
            </h1>
            <p style={{ color: MUTED, fontSize: 16, margin: "0 auto", maxWidth: 540, lineHeight: 1.6 }}>
              Every slash command, context menu action, and{" "}
              <code style={{ backgroundColor: SURFACE_2, padding: "2px 6px", borderRadius: RADIUS.sm, fontSize: 14, color: ORANGE, fontFamily: FONT_MONO }}>
                taxx!
              </code>{" "}
              prefix command — searchable and organized by category.
            </p>
          </div>

          {/* ── Legend ──────────────────────────────────────────── */}
          <ul style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 24, padding: 0, listStyle: "none" }}>
            {[
              { chip: "/slash", color: HUE.setup, mono: true,  text: "Discord slash commands" },
              { chip: "taxx!",  color: ORANGE,    mono: true,  text: "Prefix text commands" },
              { chip: "ADMIN",  color: RED,       mono: false, text: "Requires admin permission" },
            ].map((l) => (
              <li key={l.chip} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: MUTED }}>
                <span
                  style={{
                    backgroundColor: alpha(l.color, 0.13),
                    border: `1px solid ${alpha(l.color, 0.28)}`,
                    borderRadius: RADIUS.sm, padding: "2px 8px", color: l.color,
                    fontWeight: l.mono ? 600 : 700, fontSize: l.mono ? 12 : 10,
                    fontFamily: l.mono ? FONT_MONO : "inherit",
                  }}
                >
                  {l.chip}
                </span>
                {l.text}
              </li>
            ))}
          </ul>

          {/* ── Search ──────────────────────────────────────────── */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto 28px" }}>
            <Search size={16} color={SUBTLE} aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <label htmlFor="command-search" className="sr-only">Search commands</label>
            <input
              id="command-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands…"
              style={{
                width: "100%", boxSizing: "border-box", backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`, borderRadius: RADIUS.md,
                padding: "12px 38px 12px 40px", color: TEXT, fontSize: 14,
                outline: "none", fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: SUBTLE, cursor: "pointer",
                  display: "flex", alignItems: "center", padding: 6, borderRadius: RADIUS.sm,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/*
            Filtering happens with no page reload and no focus change, so a
            screen-reader user got no indication that anything had happened.
            This announces the new count politely.
          */}
          <p aria-live="polite" className="sr-only">
            {resultCount} command{resultCount === 1 ? "" : "s"} shown
          </p>

          {/* ── Category tabs ───────────────────────────────────── */}
          <div
            role="group"
            aria-label="Filter commands by category"
            style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}
          >
            {[{ id: ALL_ID, label: "All", color: TEXT, icon: null, badge: undefined }, ...allCategories].map((cat) => {
              const isActive = activeCat === cat.id;
              const color    = "color" in cat ? (cat as Category).color : TEXT;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="chip"
                  onClick={() => setActiveCat(cat.id)}
                  // A pressed toggle, not a link: aria-pressed is what tells a
                  // screen reader which filter is currently applied.
                  aria-pressed={isActive}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 13px", borderRadius: RADIUS.md, fontSize: 12.5, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    backgroundColor: isActive ? alpha(color, 0.14) : "rgba(255,255,255,0.04)",
                    color:           isActive ? color : MUTED,
                    border: `1px solid ${isActive ? alpha(color, 0.4) : "transparent"}`,
                  }}
                >
                  {"icon" in cat && cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Command list ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: MUTED }}>
            <Terminal size={32} color={SUBTLE} aria-hidden="true" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, margin: "0 0 20px" }}>
              No commands match “<strong style={{ color: TEXT }}>{query}</strong>”
              {activeCat !== ALL_ID && <> in this category</>}.
            </p>
            {/* A dead end with no way out is the classic empty-state failure:
                the filter that hid everything is still applied, and the user
                has to work out which control to undo. */}
            <button
              type="button"
              className="sx-btn sx-btn--ghost sx-btn--sm"
              onClick={() => { setQuery(""); setActiveCat(ALL_ID); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
            {filtered.map((cat, ci) => {
              const prefixCat = isPrefix(cat.id);
              return (
                <motion.section
                  key={cat.id}
                  aria-labelledby={`cat-${cat.id}`}
                  initial={still ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={still ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(ci, 6) * 0.03 }}
                >
                  {/* Category header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        backgroundColor: alpha(cat.color, 0.13),
                        border: `1px solid ${alpha(cat.color, 0.22)}`,
                        borderRadius: RADIUS.sm, padding: "6px 8px",
                        display: "flex", alignItems: "center", color: cat.color,
                      }}
                    >
                      {cat.icon}
                    </div>
                    <h2 id={`cat-${cat.id}`} style={{ fontSize: 14, fontWeight: 700, color: cat.color, margin: 0, letterSpacing: "-0.01em" }}>
                      {cat.label}
                    </h2>
                    {cat.badge && (
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700,
                          backgroundColor: alpha(cat.color, 0.13), color: cat.color,
                          border: `1px solid ${alpha(cat.color, 0.3)}`,
                          borderRadius: RADIUS.sm, padding: "2px 7px",
                          fontFamily: prefixCat ? FONT_MONO : "inherit",
                        }}
                      >
                        {cat.badge}
                      </span>
                    )}
                    {/* Was #444 — about 2:1 on the page, i.e. not readable. */}
                    <span style={{ fontSize: 12.5, color: SUBTLE, fontWeight: 500, whiteSpace: "nowrap" }}>
                      {cat.commands.length} command{cat.commands.length !== 1 ? "s" : ""}
                    </span>
                    <div aria-hidden="true" style={{ flex: 1, height: 1, backgroundColor: BORDER_SUBTLE, minWidth: 12 }} />
                  </div>

                  {/* Commands grid */}
                  <ul
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(330px, 1fr))",
                      gap: 10, margin: 0, padding: 0, listStyle: "none",
                    }}
                  >
                    {cat.commands.map((cmd) => (
                      <li
                        key={cmd.name}
                        className="card-lift"
                        style={{
                          backgroundColor: SURFACE,
                          border: `1px solid ${prefixCat ? alpha(cat.color, 0.18) : BORDER}`,
                          borderRadius: RADIUS.lg,
                          padding: "15px 16px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                          <code
                            style={{
                              fontSize: 12.5, fontWeight: 700, color: cat.color,
                              backgroundColor: alpha(cat.color, 0.11),
                              padding: "3px 8px", borderRadius: RADIUS.sm,
                              fontFamily: FONT_MONO, wordBreak: "break-word",
                            }}
                          >
                            {cmd.name}
                          </code>
                          {cmd.tags?.filter((t) => t !== "prefix").map((t) => <TagBadge key={t} tag={t} />)}
                        </div>
                        <p style={{ color: MUTED, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{cmd.desc}</p>
                        {cmd.usage && (
                          <div style={{ marginTop: 9, display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <ChevronRight size={12} color={SUBTLE} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                            {/* Was #555 on #1e1e1e — roughly 1.6:1. This is the
                                one line that tells you how to type the command,
                                so it was the worst place on the site to hide. */}
                            <code style={{ fontSize: 11.5, color: SUBTLE, fontFamily: FONT_MONO, lineHeight: 1.5, wordBreak: "break-word" }}>
                              {cmd.usage}
                            </code>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.section>
              );
            })}
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section
          style={{
            marginTop: 72, marginBottom: 24, textAlign: "center",
            padding: isMobile ? "36px 22px" : "52px 32px",
            background: `linear-gradient(135deg, ${alpha(GOLD, 0.1)} 0%, ${alpha(GOLD, 0.03)} 100%)`,
            border: `1px solid ${alpha(GOLD, 0.22)}`,
            borderRadius: RADIUS.xl,
          }}
        >
          <h2 style={{ fontSize: isMobile ? 23 : 29, fontWeight: 800, margin: "0 0 10px", color: TEXT, letterSpacing: "-0.03em" }}>
            Ready to get started?
          </h2>
          <p style={{ color: MUTED, fontSize: 15, margin: "0 0 26px" }}>
            Invite Syntaxx to your server and unlock all {totalCommands} commands.
          </p>
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="sx-btn sx-btn--primary"
            aria-label="Invite Syntaxx to your Discord server (opens in a new tab)"
          >
            Invite Syntaxx <ExternalLink size={15} aria-hidden="true" />
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
