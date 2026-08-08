import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Shield, Wrench, Gamepad2, Sparkles, Terminal,
  Search, ExternalLink, LogIn, ChevronRight, MousePointerClick,
  Image, BarChart2, Coins, Globe, SlidersHorizontal, BookOpen, Menu, X, Plus,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";

const ACCENT  = "#B8A05B";
const BG      = "#121212";
const CARD    = "#1e1e1e";
const BORDER  = "#2e2e2e";
const TEXT    = "#eeeeee";
const MUTED   = "#888888";
const GREEN   = "#57F287";
const ORANGE  = "#E67E22";
const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID ?? ""}&permissions=8&scope=bot%20applications.commands`;

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

interface AuthUser { id: string; username: string; avatar: string | null; }

function useAuth() {
  const [auth, setAuth] = useState<{ user: AuthUser | null; isOwner: boolean }>({ user: null, isOwner: false });
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then((d: { user?: AuthUser | null; isOwner?: boolean }) => {
        setAuth({ user: d.user ?? null, isOwner: d.isOwner ?? false });
      })
      .catch(() => {});
  }, []);
  return auth;
}

interface CustomCommandDto {
  id:             string;
  categoryId:     string;
  categoryLabel:  string;
  categoryColor:  string;
  name:           string;
  description:    string;
  usage:          string | null;
  commandType:    "slash" | "prefix";
  isAdmin:        boolean;
}

function useCustomCommands() {
  const [items, setItems] = useState<CustomCommandDto[]>([]);
  const load = useCallback(() => {
    fetch("/api/commands/custom", { credentials: "include" })
      .then(r => r.json())
      .then((d: { commands?: Array<Record<string, unknown>> }) => {
        const rows = (d.commands ?? []).map(r => ({
          id:            r.id as string,
          categoryId:    r.category_id as string,
          categoryLabel: r.category_label as string,
          categoryColor: r.category_color as string,
          name:          r.name as string,
          description:   r.description as string,
          usage:         (r.usage as string | null) ?? null,
          commandType:   r.command_type as "slash" | "prefix",
          isAdmin:       Boolean(r.is_admin),
        }));
        setItems(rows);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  return { items, reload: load };
}

const categories: Category[] = [
  /* ─────────────────── GENERAL ─────────────────── */
  {
    id: "general", label: "General", color: "#5865F2",
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
    id: "moderation", label: "Moderation", color: "#e74c3c",
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
    id: "setup", label: "Setup", color: "#3498db",
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
    id: "toggles", label: "Toggles", color: "#8e44ad",
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
    id: "leveling", label: "Leveling", color: "#1abc9c",
    icon: <BarChart2 size={15} />,
    commands: [
      { name: "/level",            desc: "View your current level, XP, and progress bar as a rendered canvas image — optionally check another user",  usage: "/level [@user]" },
      { name: "/level-leaderboard",desc: "Show the top 7 highest-XP users in this server with their levels and message counts as a canvas image",     usage: "/level-leaderboard" },
    ],
  },

  /* ─────────────────── CASINO ─────────────────── */
  {
    id: "casino", label: "Casino", color: "#f1c40f",
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
    id: "context", label: "Context Menu", color: "#9b59b6",
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
    id: "music", label: "Music (Pro)", color: "#1DB954",
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
    id: "prefix-mod", label: "Prefix · Moderation", color: "#c0392b",
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
    id: "prefix-setup", label: "Prefix · Setup", color: "#2980b9",
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
    id: "prefix-fun", label: "Prefix · Fun", color: "#16a085",
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

function TagBadge({ tag }: { tag: Tag }) {
  if (tag === "admin")
    return <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "rgba(231,76,60,0.12)", color: "#e74c3c", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>ADMIN</span>;
  if (tag === "pro")
    return <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40`, borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>PRO</span>;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: "rgba(230,126,34,0.12)", color: ORANGE, border: "1px solid rgba(230,126,34,0.25)", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.04em" }}>PREFIX</span>
  );
}

export default function Commands() {
  const [activeCat, setActiveCat] = useState(ALL_ID);
  const [query,     setQuery]     = useState("");
  const [isMobile,  setIsMobile]  = useState(() => window.innerWidth < 640);

  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const [showMenu, setShowMenu] = useState(false);
  const { isOwner } = useAuth();
  const { items: customCommands, reload: reloadCustomCommands } = useCustomCommands();
  const [showAddCommand, setShowAddCommand] = useState(false);

  // Merge custom (owner-added) commands into the static category list.
  const allCategories = useMemo<Category[]>(() => {
    const merged = categories.map(c => ({ ...c, commands: [...c.commands] }));
    for (const cc of customCommands) {
      const cmd: Command = {
        name: cc.name,
        desc:  cc.description,
        usage: cc.usage ?? undefined,
        tags:  [cc.commandType === "prefix" ? "prefix" : undefined, cc.isAdmin ? "admin" : undefined].filter(Boolean) as Tag[],
      };
      const existing = merged.find(c => c.id === cc.categoryId);
      if (existing) {
        existing.commands.push(cmd);
      } else {
        merged.push({
          id: cc.categoryId, label: cc.categoryLabel, color: cc.categoryColor,
          icon: <Sparkles size={15} />, commands: [cmd],
        });
      }
    }
    return merged;
  }, [customCommands]);

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

  const isPrefix = (id: string) => id.startsWith("prefix");

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)", backgroundColor: "rgba(18,18,18,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto" }} />
            {!isMobile && <span style={{ color: TEXT, fontWeight: 700, fontSize: 15 }}>syntaxx</span>}
          </Link>
          <div style={{ display: "flex", gap: isMobile ? 6 : 16, alignItems: "center", flexShrink: 0 }}>
            {!isMobile && <>
              <Link href="/"         style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Home</Link>
              <Link href="/commands" style={{ color: TEXT,  textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Commands</Link>
              <Link href="/lore" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen size={15} /> Lore
              </Link>
              <Link href="/reviews" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Reviews</Link>
            </>}
            {isMobile && (
              <button onClick={() => setShowMenu(v => !v)}
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px", color: TEXT, cursor: "pointer", display: "flex", alignItems: "center" }}>
                {showMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
            {isOwner && (
              <button onClick={() => setShowAddCommand(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(184,160,91,0.14)", border: `1px solid ${ACCENT}55`, borderRadius: 8, padding: isMobile ? "6px 8px" : "7px 14px", fontSize: 13, color: ACCENT, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                <Plus size={14} /> {!isMobile && "Add Command"}
              </button>
            )}
            <a href={INVITE_URL} target="_blank" rel="noreferrer"
              style={{ backgroundColor: ACCENT, color: "#121212", padding: isMobile ? "7px 12px" : "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              Invite {!isMobile && <ExternalLink size={12} />}
            </a>
            <Link href="/servers"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT, padding: isMobile ? "7px 8px" : "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, border: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <LogIn size={14} /> {!isMobile && "Dashboard"}
            </Link>
          </div>
        </div>
        {isMobile && showMenu && (
          <div style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.98)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <Link href="/" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Home</Link>
            <Link href="/commands" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "10px 8px", borderRadius: 8 }}>Commands</Link>
            <Link href="/lore" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={16} /> Lore
            </Link>
            <Link href="/reviews" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Reviews</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "48px 16px 32px" : "72px 24px 48px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(184,160,91,0.1)", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 999, padding: "5px 14px", marginBottom: 20, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
              <Terminal size={12} /> {totalCommands} commands — {slashCount} slash · {prefixCount} prefix
            </div>
            <h1 style={{ fontSize: isMobile ? 32 : 52, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1.5px" }}>
              All <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #d4b87a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Commands</span>
            </h1>
            <p style={{ color: MUTED, fontSize: 16, margin: "0 auto", maxWidth: 520 }}>
              Every slash command, context menu action, and <code style={{ backgroundColor: "#1e1e1e", padding: "1px 6px", borderRadius: 4, fontSize: 14, color: ORANGE }}>taxx!</code> prefix command — searchable and organized by category.
            </p>
          </div>

          {/* ── Legend ──────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
              <span style={{ backgroundColor: "rgba(52,152,219,0.15)", border: "1px solid rgba(52,152,219,0.3)", borderRadius: 4, padding: "2px 8px", color: "#3498db", fontWeight: 600, fontFamily: "monospace" }}>/slash</span>
              Discord slash commands
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
              <span style={{ backgroundColor: "rgba(230,126,34,0.12)", border: "1px solid rgba(230,126,34,0.25)", borderRadius: 4, padding: "2px 8px", color: ORANGE, fontWeight: 600, fontFamily: "monospace" }}>taxx!</span>
              Prefix text commands
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
              <span style={{ backgroundColor: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.25)", borderRadius: 4, padding: "2px 6px", color: "#e74c3c", fontWeight: 700, fontSize: 10 }}>ADMIN</span>
              Requires admin/specific permission
            </div>
          </div>

          {/* ── Search ──────────────────────────────────────────── */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto 32px" }}>
            <Search size={16} color={MUTED} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search commands…"
              style={{ width: "100%", boxSizing: "border-box", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px 12px 40px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* ── Category tabs ───────────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
            {[{ id: ALL_ID, label: "All", color: TEXT, icon: null, badge: undefined }, ...allCategories].map(cat => {
              const isActive = activeCat === cat.id;
              const color    = "color" in cat ? (cat as Category).color : TEXT;
              const prefix   = "id" in cat && isPrefix((cat as Category).id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", border: "none", transition: "all 0.15s",
                    backgroundColor: isActive ? color + "20" : "rgba(255,255,255,0.04)",
                    color:           isActive ? color : MUTED,
                    outline:         isActive ? `1px solid ${color}40` : "1px solid transparent",
                    opacity:         prefix && !isActive ? 0.85 : 1,
                  }}>
                  {"icon" in cat && cat.icon}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Command list ─────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>
            <Terminal size={32} color="#444" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15 }}>No commands match "<strong style={{ color: TEXT }}>{query}</strong>"</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {filtered.map((cat, ci) => {
              const prefixCat = isPrefix(cat.id);
              return (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.03 }}>
                  {/* Category header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ backgroundColor: cat.color + "18", borderRadius: 7, padding: "6px 8px", display: "flex", alignItems: "center", color: cat.color }}>
                      {cat.icon}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                    {cat.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, backgroundColor: cat.color + "18", color: cat.color, border: `1px solid ${cat.color}30`, borderRadius: 4, padding: "2px 7px", fontFamily: prefixCat ? "monospace" : "inherit" }}>{cat.badge}</span>
                    )}
                    <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>{cat.commands.length} command{cat.commands.length !== 1 ? "s" : ""}</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
                  </div>

                  {/* Commands grid */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 10 }}>
                    {cat.commands.map(cmd => (
                      <div key={cmd.name}
                        style={{ backgroundColor: CARD, border: `1px solid ${prefixCat ? cat.color + "22" : BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <code style={{ fontSize: 12, fontWeight: 700, color: cat.color, backgroundColor: cat.color + "12", padding: "2px 8px", borderRadius: 5, fontFamily: "'Fira Code', 'Fira Mono', monospace" }}>
                            {cmd.name}
                          </code>
                          {cmd.tags?.filter(t => t !== "prefix").map(t => <TagBadge key={t} tag={t} />)}
                        </div>
                        <p style={{ color: MUTED, fontSize: 13, margin: "0", lineHeight: 1.5 }}>{cmd.desc}</p>
                        {cmd.usage && (
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                            <ChevronRight size={11} color="#444" />
                            <code style={{ fontSize: 11, color: "#555", fontFamily: "'Fira Code', 'Fira Mono', monospace" }}>{cmd.usage}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <div style={{ marginTop: 72, textAlign: "center", padding: isMobile ? "32px 20px" : "48px 32px", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, margin: "0 0 10px" }}>Ready to get started?</h2>
          <p style={{ color: MUTED, fontSize: 15, margin: "0 0 28px" }}>Invite Syntaxx to your server and unlock all commands.</p>
          <a href={INVITE_URL} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: ACCENT, color: "#121212", padding: "13px 30px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            Invite Syntaxx <ExternalLink size={15} />
          </a>
        </div>

        <div style={{ marginTop: 40, textAlign: "center", fontSize: 12, color: "#444", paddingBottom: 40 }}>
          <Link href="/privacy" style={{ color: "#444", marginRight: 16 }}>Privacy</Link>
          <Link href="/terms"   style={{ color: "#444" }}>Terms</Link>
        </div>
      </div>

      {showAddCommand && (
        <AddCommandModal
          categories={allCategories}
          isMobile={isMobile}
          onClose={() => setShowAddCommand(false)}
          onAdded={() => { setShowAddCommand(false); reloadCustomCommands(); }}
        />
      )}
    </div>
  );
}

// ── Add Command Modal (owner only) ───────────────────────────────────────────
const PRESET_COLORS = ["#B8A05B", "#5865F2", "#e74c3c", "#57F287", "#f1c40f", "#9b59b6", "#E67E22", "#1DB954", "#3498db", "#c0392b"];

function AddCommandModal({
  categories: cats, isMobile, onClose, onAdded,
}: {
  categories: Category[];
  isMobile:   boolean;
  onClose:    () => void;
  onAdded:    () => void;
}) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [usage,        setUsage]      = useState("");
  const [commandType, setCommandType] = useState<"slash" | "prefix">("slash");
  const [isAdmin,      setIsAdmin]    = useState(false);
  const [categoryMode, setCategoryMode] = useState<"existing" | "new">("existing");
  const [categoryId,    setCategoryId]    = useState(cats[0]?.id ?? "");
  const [newCatLabel,   setNewCatLabel]   = useState("");
  const [newCatColor,   setNewCatColor]   = useState(PRESET_COLORS[0]);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const selectedExisting = cats.find(c => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) { setError("Name and description are required."); return; }
    if (categoryMode === "new" && !newCatLabel.trim()) { setError("Enter a name for the new category."); return; }
    if (categoryMode === "existing" && !selectedExisting) { setError("Pick a category."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const body = categoryMode === "existing"
        ? { categoryId: selectedExisting!.id, categoryLabel: selectedExisting!.label, categoryColor: selectedExisting!.color }
        : { categoryId: newCatLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), categoryLabel: newCatLabel.trim(), categoryColor: newCatColor };

      const res = await fetch("/api/commands/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(), description: description.trim(), usage: usage.trim() || undefined,
          commandType, isAdmin, ...body,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to add command");
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add command");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", backgroundColor: "#181818", border: `1px solid ${BORDER}`,
    borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: isMobile ? 20 : 28, width: isMobile ? "100%" : 480, maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Add Command</h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        <div>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="/mycommand or taxx!mycommand" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does this command do?" style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        <div>
          <label style={labelStyle}>Usage (optional)</label>
          <input value={usage} onChange={e => setUsage(e.target.value)} placeholder="/mycommand <arg>" style={inputStyle} />
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["slash", "prefix"] as const).map(t => (
                <button key={t} type="button" onClick={() => setCommandType(t)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${commandType === t ? ACCENT : BORDER}`, backgroundColor: commandType === t ? "rgba(184,160,91,0.14)" : "transparent", color: commandType === t ? ACCENT : TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {t === "slash" ? "/slash" : "taxx!"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: TEXT, cursor: "pointer" }}>
              <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} />
              Admin-only command
            </label>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button type="button" onClick={() => setCategoryMode("existing")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${categoryMode === "existing" ? ACCENT : BORDER}`, backgroundColor: categoryMode === "existing" ? "rgba(184,160,91,0.14)" : "transparent", color: categoryMode === "existing" ? ACCENT : TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Existing category
            </button>
            <button type="button" onClick={() => setCategoryMode("new")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${categoryMode === "new" ? ACCENT : BORDER}`, backgroundColor: categoryMode === "new" ? "rgba(184,160,91,0.14)" : "transparent", color: categoryMode === "new" ? ACCENT : TEXT, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              New category
            </button>
          </div>

          {categoryMode === "existing" ? (
            <div style={{ position: "relative" }}>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {selectedExisting && (
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", backgroundColor: selectedExisting.color, pointerEvents: "none" }} />
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newCatLabel} onChange={e => setNewCatLabel(e.target.value)} placeholder="New category name" style={inputStyle} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PRESET_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setNewCatColor(color)}
                    style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: color, border: newCatColor === color ? `2px solid ${TEXT}` : "2px solid transparent", cursor: "pointer", padding: 0 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p style={{ color: "#e74c3c", fontSize: 13, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={submitting}
          style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "inherit" }}>
          {submitting ? "Adding…" : "Add Command"}
        </button>
      </form>
    </div>
  );
}
