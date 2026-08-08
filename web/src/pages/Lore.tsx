import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, ExternalLink,
  ChevronLeft, Plus, Pencil, Trash2, X, Check, List, Heart, LogIn, User,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";

// ── Colours ──────────────────────────────────────────────────────────────────
const BG      = "#0e0d0b";
const CARD    = "#1a1814";
const SURFACE = "#221f1a";
const BORDER  = "#2e2a22";
const ACCENT  = "#B8A05B";
const TEXT    = "#e8e0d0";
const MUTED   = "#7a6f5e";
const GOLD    = "#d4b87a";
const RED     = "#e74c3c";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoreBook {
  server_id:   string;
  server_name: string;
  server_icon: string | null;
  invite_link: string | null;
}
interface LoreChapter {
  id:            string;
  discord_id:    string | null;
  display_name:  string;
  content:       string;
  chapter_order: number;
  like_count:    number;
  user_liked:    boolean;
}
interface DiscordUser { username: string; avatarUrl: string | null; }
interface AuthUser {
  id:       string;
  username: string;
  avatar:   string | null;
  isOwner?: boolean;
}

// ── Auth hook ─────────────────────────────────────────────────────────────────
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

// ── Nav user pill ─────────────────────────────────────────────────────────────
function NavUserPill({ user }: { user: AuthUser | null }) {
  if (!user) {
    return (
      <a href="/api/auth/login"
        style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, borderRadius: 20, padding: "5px 14px", fontSize: 13, color: ACCENT, textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
        <LogIn size={13} /> Login
      </a>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 12px 4px 4px" }}>
      {user.avatar
        ? <img src={user.avatar} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
        : <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: `${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={12} color={ACCENT} /></div>
      }
      <span style={{ fontSize: 13, color: TEXT, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{user.username}</span>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ discordId, displayName, size = 64 }: { discordId: string | null; displayName: string; size?: number }) {
  const [user, setUser] = useState<DiscordUser | null>(null);
  useEffect(() => {
    if (!discordId) return;
    fetch(`/api/discord/user/${discordId}`, { credentials: "include" })
      .then(r => r.json()).then((d: DiscordUser) => setUser(d)).catch(() => {});
  }, [discordId]);
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={displayName} style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${ACCENT}`, objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: SURFACE, border: `2px solid ${ACCENT}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
      {displayName.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Fixed login snackbar (rendered at page root, escapes all transforms) ──────
function LoginSnackbar({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            backgroundColor: "#1c1a16", border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: "10px 18px", zIndex: 9999,
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap",
            fontFamily: "'Inter', sans-serif", fontSize: 14, color: TEXT,
          }}
        >
          <Heart size={14} color={RED} fill={RED} />
          <span>Login to like chapters</span>
          <a href="/api/auth/login"
            style={{ color: ACCENT, fontWeight: 700, textDecoration: "none", marginLeft: 4 }}>
            Login →
          </a>
          <button onClick={onDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "0 0 0 4px", display: "flex", alignItems: "center" }}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Heart / Like button ───────────────────────────────────────────────────────
function LikeButton({ chapter, isLoggedIn, onToggle, onLoginToast }: {
  chapter: LoreChapter;
  isLoggedIn: boolean;
  onToggle:    (id: string) => void;
  onLoginToast: () => void;
}) {
  const handleClick = () => {
    if (!isLoggedIn) { onLoginToast(); return; }
    onToggle(chapter.id);
  };
  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        backgroundColor: chapter.user_liked ? `${RED}18` : SURFACE,
        border: `1px solid ${chapter.user_liked ? RED + "55" : BORDER}`,
        borderRadius: 20, padding: "6px 12px", cursor: "pointer",
        color: chapter.user_liked ? RED : MUTED,
        transition: "all 0.18s", fontFamily: "'Inter', sans-serif",
        fontSize: 13, fontWeight: 600,
      }}
      onMouseEnter={e => { if (!chapter.user_liked) { (e.currentTarget as HTMLButtonElement).style.borderColor = RED + "44"; (e.currentTarget as HTMLButtonElement).style.color = RED; }}}
      onMouseLeave={e => { if (!chapter.user_liked) { (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}}
    >
      <Heart size={14} fill={chapter.user_liked ? RED : "none"} color={chapter.user_liked ? RED : "currentColor"} />
      {chapter.like_count > 0 && chapter.like_count}
    </button>
  );
}

// ── Add Server Modal (owner only) ─────────────────────────────────────────────
function AddServerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [serverId,   setServerId]   = useState("");
  const [serverName, setServerName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const save = useCallback(async () => {
    if (!serverId.trim() || !serverName.trim()) { setError("Server ID and name are required."); return; }
    setSaving(true); setError("");
    try {
      const resp = await fetch("/api/lore", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverId: serverId.trim(), serverName: serverName.trim(), inviteLink: inviteLink.trim() || null }),
      });
      const data = await resp.json() as { error?: string };
      if (!resp.ok) { setError(data.error ?? "Failed to create."); return; }
      onCreated(); onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }, [serverId, serverName, inviteLink, onCreated, onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: TEXT, fontFamily: "'Inter', sans-serif" }}>Add New Server Book</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}><X size={20} /></button>
        </div>

        {[
          { label: "Server Name *",      value: serverName, set: setServerName, placeholder: "e.g. BMW Lovers",           mono: false },
          { label: "Discord Server ID *", value: serverId,  set: setServerId,   placeholder: "e.g. 1196951653509775481",  mono: true  },
          { label: "Invite Link",         value: inviteLink, set: setInviteLink, placeholder: "e.g. https://discord.gg/…", mono: false },
        ].map(({ label, value, set, placeholder, mono }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: MUTED, fontFamily: "'Inter', sans-serif", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ width: "100%", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 14, fontFamily: mono ? "monospace" : "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}

        <p style={{ fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif", margin: "0 0 16px" }}>
          The server icon will be fetched automatically from Discord if the bot is in that server.
        </p>

        {error && <p style={{ color: RED, fontSize: 13, margin: "0 0 12px", fontFamily: "'Inter', sans-serif" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ backgroundColor: ACCENT, border: "none", color: "#111", padding: "9px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", opacity: saving ? 0.7 : 1 }}>
            <Check size={15} /> {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit Chapter Modal ────────────────────────────────────────────────────────
function EditModal({ chapter, serverId, onClose, onSaved }: { chapter: LoreChapter | null; serverId: string; onClose: () => void; onSaved: () => void }) {
  const isNew = chapter === null;
  const [discordId,   setDiscordId]   = useState(chapter?.discord_id ?? "");
  const [displayName, setDisplayName] = useState(chapter?.display_name ?? "");
  const [content,     setContent]     = useState(chapter?.content ?? "");
  const [order,       setOrder]       = useState(chapter?.chapter_order ?? 99);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const save = useCallback(async () => {
    if (!displayName.trim() || !content.trim()) { setError("Name and content are required."); return; }
    setSaving(true); setError("");
    try {
      const url    = isNew ? `/api/lore/${serverId}/chapter` : `/api/lore/${serverId}/chapter/${chapter!.id}`;
      const method = isNew ? "POST" : "PATCH";
      const resp = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: discordId || null, displayName: displayName.trim(), content: content.trim(), chapterOrder: order }) });
      if (!resp.ok) { setError("Failed to save. Make sure you're logged in as owner."); return; }
      onSaved(); onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }, [isNew, chapter, serverId, discordId, displayName, content, order, onSaved, onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TEXT, fontFamily: "'Inter', sans-serif" }}>{isNew ? "Add Chapter" : `Edit: ${chapter!.display_name}`}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}><X size={20} /></button>
        </div>
        {[
          { label: "Display Name *",  value: displayName, set: setDisplayName, placeholder: "e.g. Queen Bee",           mono: false },
          { label: "Discord User ID", value: discordId,   set: setDiscordId,   placeholder: "e.g. 1465078979085209821", mono: true  },
        ].map(({ label, value, set, placeholder, mono }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
            <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder}
              style={{ width: "100%", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 14, fontFamily: mono ? "monospace" : "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sort Order</label>
          <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
            style={{ width: 100, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", color: TEXT, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Content *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} placeholder="Write the lore chapter here…"
            style={{ width: "100%", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px", color: TEXT, fontSize: 14, fontFamily: "'Georgia', serif", lineHeight: 1.7, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        {error && <p style={{ color: RED, fontSize: 13, margin: "0 0 12px", fontFamily: "'Inter', sans-serif" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ backgroundColor: ACCENT, border: "none", color: "#111", padding: "9px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter', sans-serif", opacity: saving ? 0.7 : 1 }}>
            <Check size={15} /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Table of Contents ─────────────────────────────────────────────────────────
function TocOverlay({ chapters, current, onSelect, onClose }: { chapters: LoreChapter[]; current: number; onSelect: (i: number) => void; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.82)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: TEXT, fontFamily: "'Inter', sans-serif" }}>Table of Contents</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={18} /></button>
        </div>
        {chapters.map((ch, i) => (
          <button key={ch.id} onClick={() => { onSelect(i); onClose(); }}
            style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", backgroundColor: i === current ? `${ACCENT}18` : "transparent", border: `1px solid ${i === current ? ACCENT + "44" : "transparent"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", marginBottom: 6, textAlign: "left" }}>
            <Avatar discordId={ch.discord_id} displayName={ch.display_name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: i === current ? ACCENT : TEXT, fontFamily: "'Inter', sans-serif" }}>{ch.display_name}</div>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: "'Inter', sans-serif" }}>Chapter {i + 1}</div>
            </div>
            {ch.like_count > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                <Heart size={11} fill={ch.user_liked ? RED : "none"} color={ch.user_liked ? RED : MUTED} /> {ch.like_count}
              </span>
            )}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Book List (landing) ───────────────────────────────────────────────────────
function BookList() {
  const { user, isOwner } = useAuth();
  const [books,   setBooks]   = useState<LoreBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const load = useCallback(() => {
    fetch("/api/lore", { credentials: "include" })
      .then(r => r.json()).then((d: { books: LoreBook[] }) => setBooks(d.books ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(14,13,11,0.95)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 14px" : "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, minWidth: 0 }}>
            <Link href="/"><img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto", cursor: "pointer", flexShrink: 0 }} /></Link>
            <span style={{ color: BORDER, fontSize: 18, flexShrink: 0 }}>›</span>
            <span style={{ color: ACCENT, fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap" }}>Lore</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
            {/* Only show Add Server button when logged in as owner */}
            {isOwner && (
              <button onClick={() => setShowAdd(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: ACCENT, border: "none", borderRadius: 8, padding: isMobile ? "6px 8px" : "7px 14px", fontSize: 13, color: "#111", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                <Plus size={14} /> {!isMobile && "Add Server"}
              </button>
            )}
            <NavUserPill user={user} />
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 20px 48px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, borderRadius: 999, padding: "6px 18px", marginBottom: 24, fontSize: 13, color: ACCENT, fontFamily: "'Inter', sans-serif" }}>
            <BookOpen size={13} /> Community Lore Books
          </div>
          <h1 style={{ fontSize: "clamp(32px,6vw,58px)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-1px", color: TEXT, lineHeight: 1.1 }}>
            The <span style={{ color: GOLD }}>Stories</span> Behind<br />the Servers
          </h1>
          <p style={{ color: MUTED, fontSize: 17, maxWidth: 480, margin: "0 auto", lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
            Real words from real members. Each book captures the soul of a community.
          </p>
        </motion.div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: MUTED, fontFamily: "'Inter', sans-serif" }}>Loading books…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {books.map((book, i) => (
              <motion.div key={book.server_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={`/lore/${book.server_id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 28px 24px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ACCENT + "77"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${ACCENT}, ${GOLD})`, borderRadius: "16px 16px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      {book.server_icon
                        ? <img src={book.server_icon} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
                        : <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={22} color={ACCENT} /></div>
                      }
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{book.server_name}</div>
                        <div style={{ fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif" }}>Lore Book</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: `${ACCENT}14`, border: `1px solid ${ACCENT}33`, borderRadius: 6, padding: "4px 10px", fontSize: 12, color: ACCENT, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                        <BookOpen size={11} /> Open Book
                      </span>
                      {book.invite_link && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.3)", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#7289da", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                          <ExternalLink size={11} /> Join Server
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {showAdd && <AddServerModal onClose={() => setShowAdd(false)} onCreated={load} />}
      </AnimatePresence>
    </div>
  );
}

// ── Book Viewer ───────────────────────────────────────────────────────────────
function BookViewer() {
  const params   = useParams<{ serverId: string }>();
  const serverId = params.serverId ?? "";
  const { user, isOwner } = useAuth();
  const isLoggedIn = !!user;

  const [book,       setBook]       = useState<LoreBook | null>(null);
  const [chapters,   setChapters]   = useState<LoreChapter[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [dir,        setDir]        = useState<1 | -1>(1);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editChapter, setEditChapter] = useState<LoreChapter | null>(null);
  const [showToc,    setShowToc]    = useState(false);
  const [loginToast, setLoginToast] = useState(false);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 640);
  const touchStartX  = useRef<number | null>(null);
  const toastTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const load = useCallback(() => {
    fetch(`/api/lore/${serverId}`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { book: LoreBook; chapters: LoreChapter[] }) => { setBook(d.book); setChapters(d.chapters ?? []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [serverId]);

  useEffect(() => { load(); }, [load]);

  const totalPages   = chapters.length + 1;
  const chapterIndex = page - 1;

  const goTo = useCallback((target: number, d: 1 | -1 = 1) => {
    if (target < 0 || target >= totalPages) return;
    setDir(d); setPage(target);
  }, [totalPages]);

  const prev = useCallback(() => goTo(page - 1, -1), [goTo, page]);
  const next = useCallback(() => goTo(page + 1,  1), [goTo, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0]?.clientX ?? null; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next(); else prev();
  };

  const showLoginToast = useCallback(() => {
    setLoginToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setLoginToast(false), 3500);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const toggleLike = useCallback(async (chapterId: string) => {
    const resp = await fetch(`/api/lore/chapter/${chapterId}/like`, { method: "POST", credentials: "include" });
    if (!resp.ok) return;
    const data = await resp.json() as { liked: boolean; like_count: number };
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, user_liked: data.liked, like_count: data.like_count } : c));
  }, []);

  const openAdd  = () => { setEditChapter(null);    setShowEdit(true); };
  const openEdit = (ch: LoreChapter) => { setEditChapter(ch); setShowEdit(true); };

  const deleteChapter = async (ch: LoreChapter) => {
    if (!window.confirm(`Delete "${ch.display_name}"?`)) return;
    await fetch(`/api/lore/${serverId}/chapter/${ch.id}`, { method: "DELETE", credentials: "include" });
    load();
    if (page >= chapters.length) setPage(Math.max(0, page - 1));
  };

  if (loading) return <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontFamily: "'Inter', sans-serif" }}>Loading…</div>;
  if (!book)   return (
    <div style={{ backgroundColor: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
      <BookOpen size={40} color={MUTED} /><p>Book not found.</p>
      <Link href="/lore" style={{ color: ACCENT }}>← Back to Lore</Link>
    </div>
  );

  const slideVariants = {
    enter:  (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  const currentChapter = chapterIndex >= 0 ? chapters[chapterIndex] : null;

  return (
    <div
      style={{ backgroundColor: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Georgia', 'Times New Roman', serif", display: "flex", flexDirection: "column", userSelect: "none" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    >
      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(14,13,11,0.96)", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)", flexShrink: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/lore">
              <button style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", gap: 5, padding: "4px 0", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
                <ChevronLeft size={16} /> {!isMobile && "Lore"}
              </button>
            </Link>
            <span style={{ color: BORDER }}>›</span>
            <span style={{ color: TEXT, fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600 }}>{book.server_name}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {book.invite_link && (
              <a href={book.invite_link} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.35)", borderRadius: 7, padding: "5px 11px", fontSize: 12, color: "#7289da", textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                <ExternalLink size={11} /> {!isMobile && "Join"}
              </a>
            )}
            <button onClick={() => setShowToc(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "5px 11px", fontSize: 12, color: TEXT, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              <List size={13} /> {!isMobile && "Contents"}
            </button>
            {/* Add Chapter only visible when logged in as owner */}
            {isOwner && (
              <button onClick={openAdd}
                style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: ACCENT, border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#111", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                <Plus size={13} /> {!isMobile && "Add Chapter"}
              </button>
            )}
            <NavUserPill user={user} />
          </div>
        </div>
      </nav>

      {/* Page area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px 16px" }}>
        <div style={{ width: "100%", maxWidth: 720, position: "relative" }}>
          <div style={{ position: "absolute", left: -4, top: 8, bottom: 8, width: 6, borderRadius: 3, background: `linear-gradient(180deg, ${ACCENT} 0%, ${GOLD} 50%, ${ACCENT} 100%)`, zIndex: 1, display: isMobile ? "none" : "block" }} />

          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={page} custom={dir} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", minHeight: isMobile ? "auto" : 560, display: "flex", flexDirection: "column" }}
            >
              {page === 0 ? (
                // Cover
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 24px" : "64px 48px", textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                    {book.server_icon
                      ? <img src={book.server_icon} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <BookOpen size={36} color={ACCENT} />
                    }
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: 3, color: MUTED, textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>The Official Lore Book of</div>
                  <h1 style={{ fontSize: "clamp(26px,5vw,42px)", fontWeight: 700, color: TEXT, margin: "0 0 8px", lineHeight: 1.2 }}>{book.server_name}</h1>
                  <div style={{ width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, margin: "16px auto 20px" }} />
                  <p style={{ color: MUTED, fontSize: 15, maxWidth: 360, lineHeight: 1.7, fontFamily: "'Inter', sans-serif", margin: "0 0 32px" }}>
                    {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} · Written by {chapters.length} member{chapters.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
                    {chapters.slice(0, 6).map(ch => <Avatar key={ch.id} discordId={ch.discord_id} displayName={ch.display_name} size={40} />)}
                  </div>
                  <button onClick={next} style={{ backgroundColor: ACCENT, border: "none", borderRadius: 10, padding: "12px 30px", color: "#111", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Inter', sans-serif" }}>
                    Begin Reading <ArrowRight size={16} />
                  </button>
                </div>
              ) : currentChapter ? (
                // Chapter
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Header */}
                  <div style={{ padding: isMobile ? "24px 20px 20px" : "32px 40px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 16, alignItems: "center", background: `linear-gradient(180deg, ${SURFACE}88 0%, transparent 100%)` }}>
                    <Avatar discordId={currentChapter.discord_id} displayName={currentChapter.display_name} size={isMobile ? 52 : 64} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, letterSpacing: 2, color: MUTED, textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginBottom: 5 }}>Chapter {chapterIndex + 1}</div>
                      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>{currentChapter.display_name}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {/* Like button — toast is rendered at page root, not inside this motion.div */}
                      <LikeButton chapter={currentChapter} isLoggedIn={isLoggedIn} onToggle={toggleLike} onLoginToast={showLoginToast} />
                      {/* Edit/Delete only visible when logged in as owner */}
                      {isOwner && <>
                        <button onClick={() => openEdit(currentChapter)} style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "6px 8px", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}><Pencil size={13} /></button>
                        <button onClick={() => deleteChapter(currentChapter)} style={{ background: "none", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 7, padding: "6px 8px", cursor: "pointer", color: RED, display: "flex", alignItems: "center" }}><Trash2 size={13} /></button>
                      </>}
                    </div>
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, padding: isMobile ? "20px" : "32px 40px", overflowY: "auto", maxHeight: isMobile ? "50vh" : 400 }}>
                    {currentChapter.content.split("\n\n").map((para, i) => (
                      <p key={i} style={{ margin: "0 0 18px", lineHeight: 1.85, fontSize: isMobile ? 15 : 16.5, color: TEXT, textAlign: "justify" }}>{para}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation dots + arrows */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20, marginTop: 20 }}>
          <button onClick={prev} disabled={page === 0}
            style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: page === 0 ? "transparent" : SURFACE, border: `1px solid ${page === 0 ? "transparent" : BORDER}`, cursor: page === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: page === 0 ? "transparent" : TEXT, transition: "all 0.15s" }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {(() => {
              const maxDots   = 9;
              const dotCount  = Math.min(totalPages, maxDots);
              const winStart  = Math.max(0, Math.min(page - Math.floor(maxDots / 2), totalPages - dotCount));
              return Array.from({ length: dotCount }).map((_, di) => {
                const i = winStart + di;
                const isActive = i === page;
                return <button key={i} onClick={() => goTo(i)}
                  style={{ width: isActive ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: isActive ? ACCENT : BORDER, border: "none", cursor: "pointer", padding: 0, transition: "all 0.2s", flexShrink: 0 }} />;
              });
            })()}
          </div>
          <button onClick={next} disabled={page >= totalPages - 1}
            style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: page >= totalPages - 1 ? "transparent" : SURFACE, border: `1px solid ${page >= totalPages - 1 ? "transparent" : BORDER}`, cursor: page >= totalPages - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: page >= totalPages - 1 ? "transparent" : TEXT, transition: "all 0.15s" }}>
            <ArrowRight size={18} />
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: MUTED, fontFamily: "'Inter', sans-serif" }}>
          {page === 0 ? "Cover" : `Chapter ${page} of ${chapters.length}`} · Swipe or use arrow keys
        </div>
      </div>

      {/* Login snackbar rendered HERE — outside AnimatePresence, not inside any motion.div */}
      <LoginSnackbar show={loginToast} onDismiss={() => setLoginToast(false)} />

      <AnimatePresence>
        {showEdit && <EditModal chapter={editChapter} serverId={serverId} onClose={() => setShowEdit(false)} onSaved={load} />}
      </AnimatePresence>
      <AnimatePresence>
        {showToc && <TocOverlay chapters={chapters} current={chapterIndex} onSelect={i => setPage(i + 1)} onClose={() => setShowToc(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Lore() {
  const params = useParams<{ serverId?: string }>();
  if (params.serverId) return <BookViewer />;
  return <BookList />;
}
