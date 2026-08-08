import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "wouter";
import {
  Shield, Coins, TrendingUp, Zap, ScanSearch, Sparkles,
  Server, Users, Terminal, ExternalLink, CheckCircle2, Globe, Activity, LogIn, BookOpen, Menu, X,
  Star, Heart,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";

// ── Brand colours ─────────────────────────────────────────────────────────────
const ACCENT  = "#B8A05B";
const BG      = "#121212";
const CARD    = "#2a2a2a";
const BORDER  = "#383838";
const TEXT    = "#eeeeee";
const MUTED   = "#888888";
const GREEN   = "#57F287";

interface BotStats {
  servers:   number | null;
  users:     number | null;
  commands:  number;
  online:    boolean;
  connected: boolean;
}

interface TopSupporter { id: string; name: string; coffees: number; amount: number; currency: string; }

interface TopReview {
  id:              string;
  discordUsername: string;
  discordAvatar:   string | null;
  rating:          number;
  content:         string;
  likeCount:       number;
}

function AnimatedNumber({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || value === null) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(value / 90));
    const t = setInterval(() => { cur = Math.min(cur + step, value); setDisplay(cur); if (cur >= value) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [inView, value]);
  return <span ref={ref}>{value === null ? "—" : display.toLocaleString("en-US")}{suffix}</span>;
}

const features = [
  { icon: Shield,     title: "Moderation",  color: "#c0392b", desc: "Ban, kick, mute, case tracking, purge, anti-raid and custom commands per server." },
  { icon: Coins,      title: "Economy",     color: ACCENT,    desc: "Chip system, wallet, casino, blackjack, roulette, slots and mines." },
  { icon: TrendingUp, title: "Leveling",    color: GREEN,     desc: "XP system, leaderboard, automatic level roles and server ranking." },
  { icon: Zap,        title: "Auto-Mod",    color: ACCENT,    desc: "Anti-spam, attachment filter, raid protection and configurable automod rules." },
  { icon: ScanSearch, title: "Alt Scanner", color: "#9b59b6", desc: "Detect alt accounts based on account age and behaviour patterns." },
  { icon: Sparkles,   title: "Fun & Tools", color: GREEN,     desc: "Color roles, AFK system, GIF editor, QR codes, sticker stealing and more." },
];

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID ?? "YOUR_CLIENT_ID"}&permissions=8&scope=bot%20applications.commands`;

// ── Top Donors Panel ──────────────────────────────────────────────────────────
function TopDonorsPanel({ supporters, isOwner, onReload, isMobile }: {
  supporters: TopSupporter[];
  isOwner: boolean;
  onReload: () => void;
  isMobile: boolean;
}) {
  const [editing,  setEditing]  = useState<TopSupporter | null>(null);
  const [adding,   setAdding]   = useState(false);
  const [form,     setForm]     = useState({ name: "", amount: "", currency: "EUR", coffees: "1" });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const RED = "#e74c3c";
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  function openAdd() { setForm({ name: "", amount: "", currency: "EUR", coffees: "1" }); setAdding(true); setEditing(null); }
  function openEdit(s: TopSupporter) { setForm({ name: s.name, amount: String(s.amount), currency: s.currency, coffees: String(s.coffees) }); setEditing(s); setAdding(false); }
  function cancel() { setAdding(false); setEditing(null); }

  async function save() {
    setSaving(true);
    const body = { name: form.name.trim(), amount: parseFloat(form.amount), currency: form.currency, coffees: parseInt(form.coffees) || 1 };
    if (!body.name || isNaN(body.amount)) { setSaving(false); return; }
    const url  = editing ? `/api/supporters/${editing.id}` : "/api/supporters";
    const method = editing ? "PATCH" : "POST";
    await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    cancel();
    onReload();
  }

  async function remove(id: string) {
    setDeleting(id);
    await fetch(`/api/supporters/${id}`, { method: "DELETE", credentials: "include" });
    setDeleting(null);
    onReload();
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#161616", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 8,
    padding: "8px 12px", color: TEXT, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  };

  const showPanel = supporters.length > 0 || isOwner;
  if (!showPanel) return null;

  return (
    <div style={{ marginTop: 48, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Supporters</span>
        {isOwner && (
          <button onClick={openAdd} style={{ marginLeft: 8, background: `rgba(184,160,91,0.15)`, border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 8, padding: "3px 12px", color: ACCENT, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Add
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div style={{ background: "rgba(184,160,91,0.06)", border: "1px solid rgba(184,160,91,0.25)", borderRadius: 14, padding: "18px 20px", marginBottom: 16, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>{editing ? "Edit supporter" : "Add supporter"}</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Name</div>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Amount (€/$)</div>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 9.00" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Currency</div>
              <select style={{ ...inputStyle }} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600 }}>Coffees</div>
              <input style={inputStyle} type="number" min="1" value={form.coffees} onChange={e => setForm(f => ({ ...f, coffees: e.target.value }))} placeholder="e.g. 3" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ background: `linear-gradient(135deg, ${ACCENT}, #d4b87a)`, color: "#121212", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add"}
            </button>
            <button onClick={cancel} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 16px", color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {supporters.length === 0 && isOwner && (
        <p style={{ textAlign: "center", color: MUTED, fontSize: 13 }}>No supporters yet — add the first one!</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 460, margin: "0 auto" }}>
        {supporters.map((s, i) => {
          const isTop = i < 3;
          return (
            <motion.div key={s.id ?? s.name}
              initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${isTop ? "rgba(184,160,91,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "12px 18px" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{medals[i]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: isTop ? TEXT : MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.coffees} {s.coffees === 1 ? "coffee" : "coffees"}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
                {s.currency === "EUR" ? "€" : s.currency === "GBP" ? "£" : "$"}{Number(s.amount).toFixed(2)}
              </div>
              {isOwner && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(s)} style={{ background: "none", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 6, padding: "4px 10px", color: ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
                  <button onClick={() => remove(s.id!)} disabled={deleting === s.id} style={{ background: "none", border: `1px solid ${RED}30`, borderRadius: 6, padding: "4px 10px", color: RED, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deleting === s.id ? 0.5 : 1 }}>
                    {deleting === s.id ? "…" : "✕"}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface AuthUser { id: string; username: string; avatar: string | null; }

export default function Home() {
  const [stats,        setStats]        = useState<BotStats | null>(null);
  const [user,         setUser]         = useState<AuthUser | null>(null);
  const [topReviews,   setTopReviews]   = useState<TopReview[]>([]);
  const [supporters,   setSupporters]   = useState<TopSupporter[]>([]);

  const isOwner = user?.id === "407257374315905024";

  function reloadSupporters() {
    fetch("/api/supporters")
      .then(r => r.json())
      .then((d: { supporters?: TopSupporter[] }) => setSupporters(d.supporters ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    fetch("/api/bot/stats", { credentials: "include" }).then(r => r.json()).then(setStats).catch(() => {});
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then((d: { user: AuthUser | null }) => { if (d.user) setUser(d.user); })
      .catch(() => {});
    fetch("/api/supporters")
      .then(r => r.json())
      .then((d: { supporters?: TopSupporter[] }) => setSupporters(d.supporters ?? []))
      .catch(() => {});
    fetch("/api/reviews/top", { credentials: "include" })
      .then(r => r.json())
      .then((d: { reviews?: Array<Record<string, unknown>> }) => {
        setTopReviews((d.reviews ?? []).slice(0, 3).map(r => ({
          id:              r.id as string,
          discordUsername: r.discord_username as string,
          discordAvatar:   (r.discord_avatar as string | null) ?? null,
          rating:          Number(r.rating),
          content:         r.content as string,
          likeCount:       Number(r.like_count ?? 0),
        })));
      })
      .catch(() => {});
  }, []);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const [showMenu, setShowMenu] = useState(false);

  const statCards = [
    { icon: Server,   label: "Servers",  value: stats?.servers  ?? null, suffix: "" },
    { icon: Users,    label: "Users",    value: stats?.users    ?? null, suffix: "" },
    { icon: Terminal, label: "Commands", value: stats?.commands ?? null, suffix: "+" },
  ];

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)", backgroundColor: "rgba(18,18,18,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexShrink: 0 }}>
            <img src={logoUrl} alt="Syntaxx" style={{ height: 30, width: "auto", flexShrink: 0 }} />
            {stats?.online && !isMobile && (
              <span style={{ backgroundColor: "rgba(87,242,135,0.12)", color: GREEN, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: `1px solid rgba(87,242,135,0.25)`, flexShrink: 0 }}>ONLINE</span>
            )}
          </div>
          <div style={{ display: "flex", gap: isMobile ? 6 : 16, alignItems: "center", flexShrink: 0 }}>
            {!isMobile && <>
              <a href="#features" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Features</a>
              <Link href="/commands" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Commands</Link>
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
            <a href={INVITE_URL} target="_blank" rel="noreferrer"
              style={{ backgroundColor: ACCENT, color: "#121212", padding: isMobile ? "7px 12px" : "8px 20px", borderRadius: 8, fontSize: isMobile ? 13 : 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              {isMobile ? "Invite" : <><span>Invite</span><ExternalLink size={13} /></>}
            </a>
            {user ? (
              <Link href="/servers" style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", padding: isMobile ? "5px 8px" : "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, textDecoration: "none", color: TEXT, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {user.avatar
                  ? <img src={user.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }} />
                  : <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#121212", flexShrink: 0 }}>{user.username.charAt(0).toUpperCase()}</div>
                }
                {!isMobile && user.username}
              </Link>
            ) : (
              <button
                onClick={() => { window.location.href = "/api/auth/login"; }}
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: TEXT, padding: isMobile ? "7px 8px" : "8px 16px", borderRadius: 8, fontSize: isMobile ? 13 : 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, border: `1px solid ${BORDER}`, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                <LogIn size={14} /> {!isMobile && "Login"}
              </button>
            )}
          </div>
        </div>
        {isMobile && showMenu && (
          <div style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.98)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
            <a href="#features" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Features</a>
            <Link href="/commands" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Commands</Link>
            <Link href="/lore" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={16} /> Lore
            </Link>
            <Link href="/reviews" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Reviews</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(184,160,91,0.1)", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 999, padding: "6px 16px", marginBottom: 28, fontSize: 13, color: ACCENT }}>
            syntaxx.LOL — Belgian Discord Bot
          </div>
          <h1 style={{ fontSize: "clamp(40px,7.5vw,78px)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-2px", color: TEXT }}>
            The most powerful<br />
            <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #d4b87a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Discord Bot</span>{" "}
            for your server
          </h1>
          <p style={{ fontSize: 18, color: MUTED, maxWidth: 520, margin: "0 auto 44px", lineHeight: 1.7 }}>
            Moderation, economy, leveling, auto-mod and more. Everything your server needs in one bot.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={INVITE_URL} target="_blank" rel="noreferrer"
              style={{ backgroundColor: ACCENT, color: "#121212", padding: "14px 34px", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              Invite Bot <ExternalLink size={16} />
            </a>
            <a href="#features"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: TEXT, padding: "14px 34px", borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none", border: `1px solid ${BORDER}` }}>
              Learn more
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Stats cards ────────────────────────────────────────────── */}
      <section id="stats" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "26px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ backgroundColor: "rgba(184,160,91,0.12)", borderRadius: 8, padding: 8 }}>
                  <s.icon size={18} color={ACCENT} />
                </div>
                <span style={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: TEXT }}>
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", color: TEXT }}>Everything you need</h2>
          <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>Powerful features, easy to use</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 }}
              whileHover={{ borderColor: ACCENT + "55", translateY: -2 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: f.color + "20", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", color: TEXT }}>{f.title}</h3>
              <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bot Status ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "32px 36px", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: TEXT }}>Bot Status</h2>
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Live system information</p>
          </div>
          <div style={{ display: "flex", gap: 44, flexWrap: "wrap" }}>
            {[
              { label: "Status",   value: stats?.online    ? "Online"        : "Unknown",       color: stats?.online    ? GREEN    : MUTED,     icon: <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: stats?.online ? GREEN : MUTED, display: "inline-block", marginRight: 6, boxShadow: stats?.online ? `0 0 8px ${GREEN}` : "none" }} /> },
              { label: "Database", value: stats?.connected ? "Connected"     : "Not connected",  color: stats?.connected ? GREEN    : "#c0392b", icon: <Activity size={14} style={{ marginRight: 6 }} /> },
              { label: "Platform", value: "syntaxx.LOL",                                          color: ACCENT,                                  icon: <Globe size={14} style={{ marginRight: 6 }} /> },
            ].map(item => (
              <div key={item.label}>
                <div style={{ color: MUTED, fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
                <div style={{ display: "flex", alignItems: "center", color: item.color, fontSize: 15, fontWeight: 600 }}>
                  {item.icon}{item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ────────────────────────────────────────────────── */}
      {topReviews.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", color: TEXT, letterSpacing: "-0.5px" }}>What people are saying</h2>
              <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Real feedback from the Syntaxx community.</p>
            </div>
            <Link href="/reviews" style={{ color: ACCENT, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              See all reviews <ExternalLink size={13} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {topReviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  {r.discordAvatar ? (
                    <img src={r.discordAvatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#121212" }}>
                      {r.discordUsername[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.discordUsername}</div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={12} fill={n <= r.rating ? ACCENT : "none"} color={n <= r.rating ? ACCENT : BORDER} />
                      ))}
                    </div>
                  </div>
                </div>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.content}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 12 }}>
                  <Heart size={13} /> {r.likeCount}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ background: `linear-gradient(135deg, rgba(184,160,91,0.12) 0%, rgba(184,160,91,0.04) 100%)`, border: `1px solid rgba(184,160,91,0.25)`, borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1px", color: TEXT }}>Ready to get started?</h2>
          <p style={{ color: MUTED, fontSize: 16, margin: "0 0 32px" }}>Add Syntaxx to your server and experience the difference.</p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            {["Free to use", "Instant setup", "Regular updates", "Support available"].map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: ACCENT, fontSize: 14, fontWeight: 500 }}>
                <CheckCircle2 size={14} color={GREEN} />{item}
              </span>
            ))}
          </div>
          <a href={INVITE_URL} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: ACCENT, color: "#121212", padding: "14px 38px", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none" }}>
            Invite Syntaxx <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* ── Support / Donate ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: "1px solid rgba(184,160,91,0.22)", background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", padding: isMobile ? "44px 24px" : "60px 60px", textAlign: "center" }}>

          {/* ambient glow */}
          <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 480, height: 240, background: "radial-gradient(ellipse, rgba(184,160,91,0.13) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: -60, width: 260, height: 260, background: "radial-gradient(ellipse, rgba(184,160,91,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: isMobile ? 44 : 52, marginBottom: 18, lineHeight: 1 }}>☕</div>
            <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px", color: TEXT }}>
              Enjoying Syntaxx?
            </h2>
            <p style={{ color: MUTED, fontSize: 15, margin: "0 auto 36px", maxWidth: 440, lineHeight: 1.75 }}>
              Syntaxx is completely free. If it's saved you time or made your server better, a coffee keeps the lights on!
            </p>

            {/* pill badges */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
              {["Credit card", "Apple Pay", "Google Pay", "PayPal"].map(m => (
                <span key={m} style={{ fontSize: 12, fontWeight: 600, color: ACCENT, backgroundColor: "rgba(184,160,91,0.1)", border: "1px solid rgba(184,160,91,0.22)", borderRadius: 999, padding: "4px 12px" }}>{m}</span>
              ))}
            </div>

            <a href="https://www.buymeacoffee.com/syntaxx.lol" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: `linear-gradient(135deg, ${ACCENT} 0%, #d4b87a 100%)`, color: "#121212", padding: isMobile ? "13px 28px" : "15px 38px", borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 28px rgba(184,160,91,0.3)", letterSpacing: "-0.2px" }}>
              ☕ Buy me a coffee
            </a>

            <p style={{ color: "#3a3a3a", fontSize: 12, marginTop: 20, marginBottom: 0 }}>
              Secure payments via Buy Me a Coffee · Powered by Stripe
            </p>

            {/* ── Top donors ── */}
            <TopDonorsPanel supporters={supporters} isOwner={isOwner} onReload={reloadSupporters} isMobile={isMobile} />
          </div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto", marginBottom: 10, opacity: 0.8 }} />
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>
            <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Terms of Service</Link>
            {" · "}
            <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy Policy</Link>
            {" · "}
            <Link href="/lore" style={{ color: MUTED, textDecoration: "none" }}>Lore</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
