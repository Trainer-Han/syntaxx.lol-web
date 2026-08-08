import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft, Edit2, Check, X, BookOpen, Shield,
  Users, FileText, Lock, Hash, ChevronDown, Pencil, Plus, Trash2, Zap,
  ShieldCheck, Globe, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#1e1e1e";
const BORDER = "#2e2e2e";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";
const GREEN  = "#57F287";
const RED    = "#ED4245";
const ORANGE = "#FFA500";

interface GuildInfo { id: string; name: string; icon: string | null; nickname: string | null; }
interface Channel   { id: string; name: string; botCanAccess: boolean; }
interface Role      { id: string; name: string; color: number; }
interface Settings {
  modLogChannel?:    string;
  memberLogChannel?: string;
  messageLogChannel?: string;
  autoMod?:          boolean;
}
interface AutomodSettings {
  enabled:        boolean;
  dmEnabled:      boolean;
  customWords:    string[];
  exceptChannels: string[];
  exceptRoles:    string[];
  exceptUsers:    string[];
}
interface DropdownOption { id: string; label: string; disabled?: boolean; disabledReason?: string; color?: number; }

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// ── Custom dropdown ──────────────────────────────────────────────
function Dropdown({ value, onChange, options, placeholder, icon: Icon }: {
  value: string; onChange: (v: string) => void;
  options: DropdownOption[]; placeholder: string;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = options.find(o => o.id === value);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#161616", border: `1px solid ${open ? ACCENT + "80" : BORDER}`, borderRadius: 10, padding: "11px 14px", cursor: "pointer", fontFamily: "inherit", color: selected ? TEXT : MUTED, fontSize: 14, transition: "border-color 0.15s", outline: "none" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selected && Icon && <Icon size={14} color={MUTED} />}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} color={MUTED} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200, backgroundColor: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: 260, overflowY: "auto", transformOrigin: "top" }}>
            {value && (
              <div onClick={() => { onChange(""); setOpen(false); }}
                style={{ padding: "10px 14px", fontSize: 13, color: MUTED, cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#222")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                ✕ Clear selection
              </div>
            )}
            {options.map(opt => {
              const isSelected = opt.id === value;
              const dot = opt.color ? `#${opt.color.toString(16).padStart(6, "0")}` : null;
              return (
                <div key={opt.id}
                  onClick={() => { if (!opt.disabled) { onChange(opt.id); setOpen(false); } }}
                  title={opt.disabled ? opt.disabledReason : undefined}
                  style={{ padding: "10px 14px", fontSize: 14, display: "flex", alignItems: "center", gap: 8, cursor: opt.disabled ? "not-allowed" : "pointer", backgroundColor: isSelected ? `${ACCENT}18` : "transparent", color: opt.disabled ? "#444" : isSelected ? ACCENT : TEXT, transition: "background 0.1s" }}
                  onMouseEnter={e => { if (!opt.disabled && !isSelected) e.currentTarget.style.backgroundColor = "#242424"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}>
                  {dot && dot !== "#000000" && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />}
                  {Icon && !dot && <Icon size={13} color={opt.disabled ? "#444" : MUTED} />}
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {opt.disabled && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555" }}><Lock size={10} /> no perms</span>}
                  {isSelected && !opt.disabled && <Check size={13} color={ACCENT} />}
                </div>
              );
            })}
            {options.length === 0 && <div style={{ padding: 14, fontSize: 13, color: MUTED, textAlign: "center" }}>No options</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", backgroundColor: value ? ACCENT : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: value ? 25 : 3, transition: "left 0.2s" }} />
    </button>
  );
}

// ── Selector card (channel / role pickers) ───────────────────────
function SelectorCard({ icon, iconColor, title, desc, currentLabel, currentColor,
  isEditing, onStartEdit, onCancelEdit, children, saved, saving, onSave, dirty }: {
  icon: React.ReactNode; iconColor: string; title: string; desc: string;
  currentLabel: string; currentColor?: string;
  isEditing: boolean; onStartEdit: () => void; onCancelEdit: () => void;
  children: React.ReactNode;
  saved: boolean; saving: boolean; onSave: () => void; dirty: boolean;
}) {
  const isMobile = useIsMobile();
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${isEditing && dirty ? ACCENT + "60" : BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16, transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: isEditing ? 16 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: `${iconColor}18`, borderRadius: 8, padding: 8 }}>{icon}</div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{desc}</p>
          </div>
        </div>
        {!isEditing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {saved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {currentColor && <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: currentColor }} />}
              <span style={{ fontSize: 13, color: currentLabel === "Not set" ? MUTED : TEXT, fontWeight: currentLabel === "Not set" ? 400 : 600 }}>{currentLabel}</span>
            </div>
            <button onClick={onStartEdit}
              style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
              <Pencil size={12} /> Change
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {saved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
            {dirty && !saved && (
              <button onClick={onSave} disabled={saving}
                style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
                <Check size={13} /> {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button onClick={onCancelEdit}
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", fontFamily: "inherit" }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      {isEditing && children}
    </div>
  );
}

// ── Toggle card ──────────────────────────────────────────────────

// ── Section divider ───────────────────────────────────────────────
function SectionHeader({ title, icon, first }: { title: string; icon: string; first?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: first ? 0 : 40, marginBottom: 16 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: 1, backgroundColor: BORDER }} />
    </div>
  );
}

// ── Auto-Role + Join Log card ─────────────────────────────────────
function MemberLogSetupCard({ guildId, channels, roles }: { guildId: string; channels: Channel[]; roles: Role[] }) {
  const [logChannel, setLogChannel] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [botRole,    setBotRole]    = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [orig, setOrig] = useState({ logChannel: "", memberRole: "", botRole: "" });
  const isMobile = useIsMobile();

  const dirty = logChannel !== orig.logChannel || memberRole !== orig.memberRole || botRole !== orig.botRole;

  useEffect(() => {
    fetch(`/api/guild/${guildId}/memberlog-setup`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { logChannel?: string | null; memberRole?: string | null; botRole?: string | null }) => {
        const init = { logChannel: d.logChannel ?? "", memberRole: d.memberRole ?? "", botRole: d.botRole ?? "" };
        setLogChannel(init.logChannel); setMemberRole(init.memberRole); setBotRole(init.botRole);
        setOrig(init); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/memberlog-setup`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logChannel: logChannel || null, memberRole: memberRole || null, botRole: botRole || null }),
    });
    setSaving(false);
    if (res.ok) { setOrig({ logChannel, memberRole, botRole }); setSaved(true); setTimeout(() => setSaved(false), 4000); }
  }

  const chOpts: DropdownOption[] = channels.map(c => ({ id: c.id, label: c.name, disabled: !c.botCanAccess, disabledReason: "Bot can't see this channel" }));
  const rlOpts: DropdownOption[] = roles.map(r => ({ id: r.id, label: r.name, color: r.color }));
  const TEAL = "#1ABC9C";
  const subLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${dirty ? ACCENT + "60" : BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16, transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0, marginBottom: loading ? 0 : 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: `${TEAL}18`, borderRadius: 8, padding: 8 }}><Users size={18} color={TEAL} /></div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Auto-Role & Join Log</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Auto-assign roles on join, log member join/leave events</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
          {dirty && !saved && (
            <button onClick={save} disabled={saving}
              style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
              <Check size={13} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
      {loading ? <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Loading…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={subLabel}><Hash size={12} /> Log Channel <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>— join/leave events posted here</span></div>
            <Dropdown value={logChannel} onChange={setLogChannel} options={chOpts} placeholder="Select a channel…" icon={Hash} />
          </div>
          <div>
            <div style={subLabel}><Users size={12} /> Member Auto-Role <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>— given to new human members</span></div>
            <Dropdown value={memberRole} onChange={setMemberRole} options={rlOpts} placeholder="No role (optional)" />
          </div>
          <div>
            <div style={subLabel}><Zap size={12} /> Bot Auto-Role <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>— given to new bots that join</span></div>
            <Dropdown value={botRole} onChange={setBotRole} options={rlOpts} placeholder="No role (optional)" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Level system toggle ───────────────────────────────────────────
function LevelsCard({ guildId }: { guildId: string }) {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`/api/guild/${guildId}/levels`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { enabled?: boolean }) => { setEnabled(d.enabled ?? true); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guildId]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/levels`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16 }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: "#5865F218", borderRadius: 8, padding: 8, fontSize: 18 }}>📊</div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Level System</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Track XP and rank members as they chat</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saved  && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>✓ Saved</span>}
          {saving && <span style={{ color: MUTED,  fontSize: 12 }}>Saving…</span>}
          <span style={{ fontSize: 12, fontWeight: 700, color: enabled ? GREEN : MUTED, backgroundColor: enabled ? `${GREEN}15` : "rgba(255,255,255,0.04)", border: `1px solid ${enabled ? GREEN + "30" : BORDER}`, borderRadius: 999, padding: "3px 10px" }}>
            {enabled ? "● Enabled" : "○ Disabled"}
          </span>
          {!loading && (
            <button onClick={toggle}
              style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", backgroundColor: enabled ? ACCENT : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: enabled ? 21 : 3, transition: "left 0.2s" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Level-up message channel ──────────────────────────────────────
function LevelChannelCard({ guildId, channels }: { guildId: string; channels: Channel[] }) {
  const [channelId, setChannelId] = useState("");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`/api/guild/${guildId}/level-channel`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { channelId?: string | null }) => { setChannelId(d.channelId ?? ""); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guildId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/level-channel`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: channelId || null }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  const options: DropdownOption[] = channels.map(c => ({
    id: c.id, label: `# ${c.name}`,
    disabled: !c.botCanAccess,
    disabledReason: !c.botCanAccess ? "Bot can't access" : undefined,
  }));

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ backgroundColor: "#d4b47c18", borderRadius: 8, padding: 8, fontSize: 18 }}>🏆</div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Level-Up Channel</h2>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Where level-up notifications are sent. Leave empty to post in the same channel as the message.</p>
        </div>
      </div>
      {loading ? (
        <div style={{ color: MUTED, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}>
          <div style={{ flex: 1 }}>
            <Dropdown value={channelId} onChange={setChannelId} options={options} placeholder="Same channel as message" icon={Hash} />
          </div>
          <button onClick={save} disabled={saving}
            style={{ padding: "11px 22px", borderRadius: 10, border: "none", backgroundColor: ACCENT, color: "#000", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, whiteSpace: "nowrap" }}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Auto-Mod config card ─────────────────────────────────────────
function AutoModCard({ guildId, channels, roles }: {
  guildId: string;
  channels: Channel[];
  roles: Role[];
  serverName: string;
}) {
  const empty: AutomodSettings = { enabled: false, dmEnabled: false, customWords: [], exceptChannels: [], exceptRoles: [], exceptUsers: [] };
  const [data,    setData]    = useState<AutomodSettings>(empty);
  const [draft,   setDraft]   = useState<AutomodSettings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [wordInput, setWordInput] = useState("");
  const [exceptCh,  setExceptCh]  = useState("");
  const [exceptRl,  setExceptRl]  = useState("");
  const [exceptUsr, setExceptUsr] = useState("");

  useEffect(() => {
    fetch(`/api/guild/${guildId}/automod`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const clean: AutomodSettings = {
          enabled:        d.enabled        ?? false,
          dmEnabled:      d.dmEnabled      ?? false,
          customWords:    Array.isArray(d.customWords)    ? d.customWords    : [],
          exceptChannels: Array.isArray(d.exceptChannels) ? d.exceptChannels : [],
          exceptRoles:    Array.isArray(d.exceptRoles)    ? d.exceptRoles    : [],
          exceptUsers:    Array.isArray(d.exceptUsers)    ? d.exceptUsers    : [],
        };
        setData(clean); setDraft(clean); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  async function save(patch?: Partial<AutomodSettings>) {
    const toSave = patch ? { ...draft, ...patch } : draft;
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/automod`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    setSaving(false);
    if (res.ok) { setData(toSave); setDraft(toSave); setSaved(true); setTimeout(() => setSaved(false), 4000); }
  }

  function toggleField(field: "enabled" | "dmEnabled") {
    const patch = { ...draft, [field]: !draft[field] };
    setDraft(patch);
    save(patch);
  }

  function addWord() {
    const w = wordInput.trim().toLowerCase();
    if (!w || draft.customWords.includes(w)) { setWordInput(""); return; }
    setDraft(d => ({ ...d, customWords: [...d.customWords, w] }));
    setWordInput("");
  }
  function removeWord(w: string) { setDraft(d => ({ ...d, customWords: d.customWords.filter(x => x !== w) })); }

  function addChannel() {
    if (!exceptCh || draft.exceptChannels.includes(exceptCh)) { setExceptCh(""); return; }
    setDraft(d => ({ ...d, exceptChannels: [...d.exceptChannels, exceptCh] }));
    setExceptCh("");
  }
  function removeChannel(id: string) { setDraft(d => ({ ...d, exceptChannels: d.exceptChannels.filter(x => x !== id) })); }

  function addRole() {
    if (!exceptRl || draft.exceptRoles.includes(exceptRl)) { setExceptRl(""); return; }
    setDraft(d => ({ ...d, exceptRoles: [...d.exceptRoles, exceptRl] }));
    setExceptRl("");
  }
  function removeRole(id: string) { setDraft(d => ({ ...d, exceptRoles: d.exceptRoles.filter(x => x !== id) })); }

  function addUser() {
    const raw = exceptUsr.trim();
    const idMatch = raw.match(/^<@!?(\d{17,20})>$/) || raw.match(/^(\d{17,20})$/);
    const id = idMatch ? idMatch[1] : "";
    if (!id || draft.exceptUsers.includes(id)) { setExceptUsr(""); return; }
    setDraft(d => ({ ...d, exceptUsers: [...d.exceptUsers, id] }));
    setExceptUsr("");
  }
  function removeUser(id: string) { setDraft(d => ({ ...d, exceptUsers: d.exceptUsers.filter(x => x !== id) })); }

  const chName = (id: string) => channels.find(c => c.id === id)?.name ?? id;
  const rlName = (id: string) => roles.find(r => r.id === id)?.name ?? id;
  const rlColor = (id: string) => { const c = roles.find(r => r.id === id)?.color; return c ? `#${c.toString(16).padStart(6, "0")}` : MUTED; };

  const channelOptions: DropdownOption[] = channels
    .filter(c => !draft.exceptChannels.includes(c.id))
    .map(c => ({ id: c.id, label: c.name, disabled: !c.botCanAccess }));
  const roleOptions: DropdownOption[] = roles
    .filter(r => !draft.exceptRoles.includes(r.id))
    .map(r => ({ id: r.id, label: r.name, color: r.color }));

  const section: React.CSSProperties = { marginTop: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}` };
  const label: React.CSSProperties   = { fontSize: 13, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 };
  const chip = (text: string, onRemove: () => void, color?: string) => (
    <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#252525", border: `1px solid ${BORDER}`, borderRadius: 999, padding: "4px 10px 4px 12px", fontSize: 13, color: color ?? TEXT }}>
      {color && <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />}
      {text}
      <button onClick={onRemove} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center" }}><X size={12} /></button>
    </span>
  );

  const isMobile = useIsMobile();

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${dirty ? ACCENT + "60" : BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16, transition: "border-color 0.2s" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: `${RED}18`, borderRadius: 8, padding: 8 }}><Shield size={18} color={RED} /></div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Auto-Mod</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Anti-spam, filters &amp; content protection</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
          {dirty && !saved && (
            <button onClick={() => save()} disabled={saving}
              style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
              <Check size={13} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {loading ? <p style={{ color: MUTED, marginTop: 20, fontSize: 13 }}>Loading…</p> : <>

        {/* Toggles */}
        <div style={{ ...section, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {(["enabled", "dmEnabled"] as const).map(field => (
            <div key={field} onClick={() => toggleField(field)}
              style={{ flex: "1 1 200px", backgroundColor: "#161616", border: `1px solid ${draft[field] ? ACCENT + "40" : BORDER}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none", transition: "border-color 0.15s" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{field === "enabled" ? "Auto-Mod Enabled" : "DM Members on Warn"}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{field === "enabled" ? "Master switch" : "Notify users privately"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: draft[field] ? GREEN : MUTED }}>{draft[field] ? "ON" : "OFF"}</span>
                <div style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: draft[field] ? ACCENT : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: draft[field] ? 21 : 3, transition: "left 0.2s" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Except Channels */}
        <div style={section}>
          <div style={label}>Except Channels <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0 }}>— auto-mod won't trigger here</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Dropdown value={exceptCh} onChange={setExceptCh} options={channelOptions} placeholder="Select a channel to exclude…" icon={Hash} />
            </div>
            <button onClick={addChannel} disabled={!exceptCh}
              style={{ backgroundColor: exceptCh ? ACCENT : "#2a2a2a", color: exceptCh ? "#121212" : MUTED, border: "none", borderRadius: 10, padding: "0 18px", cursor: exceptCh ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", flexShrink: 0, transition: "background 0.15s" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {draft.exceptChannels.length === 0
              ? <span style={{ fontSize: 13, color: "#444" }}>No channels excluded yet</span>
              : draft.exceptChannels.map(id => chip(`#${chName(id)}`, () => removeChannel(id)))}
          </div>
        </div>

        {/* Except Roles */}
        <div style={section}>
          <div style={label}>Except Roles <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0 }}>— these roles bypass auto-mod</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Dropdown value={exceptRl} onChange={setExceptRl} options={roleOptions} placeholder="Select a role to exclude…" />
            </div>
            <button onClick={addRole} disabled={!exceptRl}
              style={{ backgroundColor: exceptRl ? ACCENT : "#2a2a2a", color: exceptRl ? "#121212" : MUTED, border: "none", borderRadius: 10, padding: "0 18px", cursor: exceptRl ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", flexShrink: 0, transition: "background 0.15s" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {draft.exceptRoles.length === 0
              ? <span style={{ fontSize: 13, color: "#444" }}>No roles excluded yet</span>
              : draft.exceptRoles.map(id => chip(`@${rlName(id)}`, () => removeRole(id), rlColor(id) !== MUTED ? rlColor(id) : undefined))}
          </div>
        </div>

        {/* Except Users */}
        <div style={section}>
          <div style={label}>Except Users <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0 }}>— these users bypass auto-mod</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={exceptUsr} onChange={e => setExceptUsr(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addUser(); }}
              placeholder="Paste a user ID or @mention…"
              style={{ flex: 1, backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            <button onClick={addUser} disabled={!exceptUsr.trim()}
              style={{ backgroundColor: exceptUsr.trim() ? ACCENT : "#2a2a2a", color: exceptUsr.trim() ? "#121212" : MUTED, border: "none", borderRadius: 10, padding: "0 18px", cursor: exceptUsr.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", flexShrink: 0, transition: "background 0.15s" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {draft.exceptUsers.length === 0
              ? <span style={{ fontSize: 13, color: "#444" }}>No users excluded yet</span>
              : draft.exceptUsers.map(id => chip(`@${id}`, () => removeUser(id)))}
          </div>
        </div>

        {/* Custom Words */}
        <div style={section}>
          <div style={label}>Custom Banned Words <span style={{ fontWeight: 400, color: "#555", textTransform: "none", letterSpacing: 0 }}>— auto-flagged in addition to built-in filters</span></div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={wordInput} onChange={e => setWordInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addWord(); }}
              placeholder="Type a word and press Enter or Add…"
              style={{ flex: 1, backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px", color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            <button onClick={addWord} disabled={!wordInput.trim()}
              style={{ backgroundColor: wordInput.trim() ? ACCENT : "#2a2a2a", color: wordInput.trim() ? "#121212" : MUTED, border: "none", borderRadius: 10, padding: "0 18px", cursor: wordInput.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", flexShrink: 0, transition: "background 0.15s" }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {draft.customWords.length === 0
              ? <span style={{ fontSize: 13, color: "#444" }}>No custom words added yet</span>
              : draft.customWords.map(w => chip(w, () => removeWord(w)))}
          </div>
        </div>

      </>}
    </div>
  );
}

// ── Car / Cat fun toggles ────────────────────────────────────────
function FunCard({ guildId }: { guildId: string }) {
  const [car, setCar] = useState(true);
  const [cat, setCat] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`/api/guild/${guildId}/fun`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { setCar(d.car?.enabled ?? true); setCat(d.cat?.enabled ?? true); setLoading(false); })
      .catch(() => setLoading(false));
  }, [guildId]);

  async function toggle(feature: "car" | "cat", newVal: boolean) {
    if (feature === "car") setCar(newVal); else setCat(newVal);
    setSaving(s => ({ ...s, [feature]: true }));
    const res = await fetch(`/api/guild/${guildId}/fun/${feature}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newVal }),
    });
    setSaving(s => ({ ...s, [feature]: false }));
    if (res.ok) { setSaved(s => ({ ...s, [feature]: true })); setTimeout(() => setSaved(s => ({ ...s, [feature]: false })), 3000); }
  }

  const BLUE  = "#5865F2";
  const rows: Array<{ key: "car" | "cat"; emoji: string; label: string; desc: string; color: string; val: boolean }> = [
    { key: "car", emoji: "🚗", label: "Car Images", desc: "Post a random car pic on command", color: BLUE, val: car },
    { key: "cat", emoji: "🐱", label: "Cat Images", desc: "Post a random cat pic on command", color: "#FFA500", val: cat },
  ];

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 32px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: loading ? 0 : 20 }}>
        <div style={{ backgroundColor: "#5865F218", borderRadius: 8, padding: 8, fontSize: 18 }}>🎉</div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Fun Commands</h2>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Enable or disable image commands</p>
        </div>
      </div>
      {loading ? <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Loading…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(({ key, emoji, label, desc, val }) => (
            <div key={key} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 0, backgroundColor: "#161616", border: `1px solid ${val ? ACCENT + "30" : BORDER}`, borderRadius: 12, padding: "14px 18px", transition: "border-color 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{label}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>{desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {saved[key] && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>✓ Saved</span>}
                {saving[key] && <span style={{ color: MUTED, fontSize: 12 }}>Saving…</span>}
                <span style={{ fontSize: 12, fontWeight: 700, color: val ? GREEN : MUTED, backgroundColor: val ? `${GREEN}15` : "rgba(255,255,255,0.04)", border: `1px solid ${val ? GREEN + "30" : BORDER}`, borderRadius: 999, padding: "3px 10px" }}>
                  {val ? "● On" : "○ Off"}
                </span>
                <button onClick={() => toggle(key, !val)}
                  style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", backgroundColor: val ? ACCENT : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff", position: "absolute", top: 3, left: val ? 21 : 3, transition: "left 0.2s" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom Commands ───────────────────────────────────────────────
interface CustomCommand { trigger: string; response: string; createdBy?: string; createdAt?: string; }

function CustomCommandsCard({ guildId }: { guildId: string }) {
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [isPro,    setIsPro]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [trigger,  setTrigger]  = useState("");
  const [response, setResponse] = useState("");
  const [error,    setError]    = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if the guild owner has Pro, then load commands only if so
    fetch(`/api/guild/${guildId}/pro`, { credentials: "include" })
      .then(r => r.json())
      .then(async () => {
        setIsPro(true);
        const r = await fetch(`/api/guild/${guildId}/custom-commands`, { credentials: "include" });
        const c = await r.json() as { commands?: CustomCommand[] };
        setCommands(Array.isArray(c.commands) ? c.commands : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [guildId]);

  async function saveCommands(updated: CustomCommand[]) {
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/custom-commands`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commands: updated }),
    });
    setSaving(false);
    if (res.ok) setCommands(updated);
  }

  function addCommand() {
    const t = trigger.trim().toLowerCase();
    const r = response.trim();
    if (!t) { setError("Trigger can't be empty"); return; }
    if (!r) { setError("Response can't be empty"); return; }
    if (commands.find(c => c.trigger === t)) { setError(`"${t}" already exists`); return; }
    setError("");
    const updated = [...commands, { trigger: t, response: r, createdAt: new Date().toISOString() }];
    saveCommands(updated);
    setTrigger(""); setResponse("");
  }

  function removeCommand(t: string) { saveCommands(commands.filter(c => c.trigger !== t)); }

  const inputStyle: React.CSSProperties = { backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", color: TEXT, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${isPro ? BORDER : ACCENT + "40"}`, borderRadius: 16, padding: "28px 32px", marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ backgroundColor: `${ACCENT}18`, borderRadius: 8, padding: 8, fontSize: 18 }}>💬</div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Custom Commands</h2>
          <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Words or phrases the bot auto-replies to</p>
        </div>
        {saving && <span style={{ marginLeft: "auto", color: MUTED, fontSize: 12 }}>Saving…</span>}
      </div>

      {/* Command list */}
      {loading ? <p style={{ color: MUTED, fontSize: 13 }}>Loading…</p> : (
        <>
          {commands.length === 0 ? (
            <p style={{ color: "#444", fontSize: 13, marginBottom: 20 }}>No custom commands yet — add one below.</p>
          ) : (
            <div style={{ marginBottom: 20, borderRadius: 10, overflow: "hidden", border: `1px solid ${BORDER}` }}>
              {!isMobile && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 0, backgroundColor: "#161616", padding: "10px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Trigger</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>Response</span>
                  <span />
                </div>
              )}
              {commands.map((cmd, i) => (
                isMobile ? (
                  <div key={cmd.trigger} style={{ padding: "12px 16px", borderBottom: i < commands.length - 1 ? `1px solid ${BORDER}` : "none", backgroundColor: i % 2 === 0 ? "transparent" : "#1a1a1a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: ACCENT, fontWeight: 600 }}>{cmd.trigger}</span>
                      <button onClick={() => removeCommand(cmd.trigger)}
                        style={{ background: "none", border: `1px solid ${RED}30`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: RED, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "inherit" }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                    <span style={{ fontSize: 13, color: MUTED, wordBreak: "break-word" }}>{cmd.response}</span>
                  </div>
                ) : (
                  <div key={cmd.trigger} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: i < commands.length - 1 ? `1px solid ${BORDER}` : "none", backgroundColor: i % 2 === 0 ? "transparent" : "#1a1a1a" }}>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: ACCENT, fontWeight: 600 }}>{cmd.trigger}</span>
                    <span style={{ fontSize: 13, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={cmd.response}>{cmd.response}</span>
                    <button onClick={() => removeCommand(cmd.trigger)}
                      style={{ background: "none", border: `1px solid ${RED}30`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: RED, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "inherit" }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Add form */}
          <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Add Command</div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Trigger word / phrase</div>
                  <input value={trigger} onChange={e => { setTrigger(e.target.value); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addCommand(); }}
                    placeholder="e.g. hello" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Bot response</div>
                  <input value={response} onChange={e => { setResponse(e.target.value); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addCommand(); }}
                    placeholder="e.g. Hey there!" style={inputStyle} />
                </div>
                <button onClick={addCommand}
                  style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit", width: "100%" }}>
                  <Plus size={14} /> Add Command
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Trigger word / phrase</div>
                  <input value={trigger} onChange={e => { setTrigger(e.target.value); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addCommand(); }}
                    placeholder="e.g. hello" style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Bot response</div>
                  <input value={response} onChange={e => { setResponse(e.target.value); setError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") addCommand(); }}
                    placeholder="e.g. Hey there!" style={inputStyle} />
                </div>
                <div style={{ paddingTop: 22 }}>
                  <button onClick={addCommand}
                    style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            )}
            {error && <p style={{ color: RED, fontSize: 12, margin: "8px 0 0" }}>{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ── Verification Card ─────────────────────────────────────────────
function VerificationCard({ guildId, channels, roles }: { guildId: string; channels: Channel[]; roles: Role[] }) {
  const [enabled,        setEnabled]        = useState(false);
  const [blockAlts,      setBlockAlts]      = useState(true);
  const [roleId,         setRoleId]         = useState("");
  const [channelId,      setChannelId]      = useState("");
  const [verifiedCount,  setVerifiedCount]  = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [sending,        setSending]        = useState(false);
  const [sendMsg,        setSendMsg]        = useState<{ ok: boolean; text: string } | null>(null);
  const [orig, setOrig] = useState({ enabled: false, blockAlts: true, roleId: "", channelId: "" });
  const isMobile = useIsMobile();

  const dirty = enabled !== orig.enabled || blockAlts !== orig.blockAlts || roleId !== orig.roleId || channelId !== orig.channelId;

  useEffect(() => {
    fetch(`/api/guild/${guildId}/verification`, { credentials: "include" })
      .then(r => r.json())
      .then((d: { enabled?: boolean; blockAlts?: boolean; roleId?: string | null; channelId?: string | null; verifiedCount?: number }) => {
        const init = {
          enabled:   d.enabled   ?? false,
          blockAlts: d.blockAlts ?? true,
          roleId:    d.roleId    ?? "",
          channelId: d.channelId ?? "",
        };
        setEnabled(init.enabled); setBlockAlts(init.blockAlts);
        setRoleId(init.roleId); setChannelId(init.channelId);
        setVerifiedCount(d.verifiedCount ?? 0);
        setOrig(init); setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/guild/${guildId}/verification`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, blockAlts, roleId: roleId || null, channelId: channelId || null }),
    });
    setSaving(false);
    if (res.ok) {
      setOrig({ enabled, blockAlts, roleId, channelId });
      setSaved(true); setTimeout(() => setSaved(false), 4000);
    }
  }

  async function sendMessage() {
    setSending(true); setSendMsg(null);
    const res = await fetch(`/api/guild/${guildId}/verification/send`, {
      method: "POST", credentials: "include",
    });
    const d = await res.json() as { ok?: boolean; error?: string };
    setSending(false);
    setSendMsg({ ok: !!d.ok, text: d.ok ? "Verification message sent!" : (d.error ?? "Failed to send.") });
    setTimeout(() => setSendMsg(null), 6000);
  }

  const chOpts: DropdownOption[] = channels.map(c => ({ id: c.id, label: c.name, disabled: !c.botCanAccess, disabledReason: "Bot can't see this channel" }));
  const rlOpts: DropdownOption[] = roles.map(r => ({ id: r.id, label: r.name, color: r.color }));
  const subLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };
  const BLUE = "#5865F2";

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${dirty ? ACCENT + "60" : BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16, transition: "border-color 0.2s" }}>

      {/* Header row */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: loading ? 0 : 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ backgroundColor: `${BLUE}18`, borderRadius: 8, padding: 8 }}><ShieldCheck size={18} color={BLUE} /></div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>IP Verification</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Members verify on your website — alts blocked by IP</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {saved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
          {!loading && (
            <span style={{ fontSize: 12, fontWeight: 700, color: enabled ? GREEN : MUTED, backgroundColor: enabled ? `${GREEN}15` : "rgba(255,255,255,0.04)", border: `1px solid ${enabled ? GREEN + "30" : BORDER}`, borderRadius: 999, padding: "3px 10px" }}>
              {enabled ? "● Enabled" : "○ Disabled"}
            </span>
          )}
          {dirty && !saved && (
            <button onClick={save} disabled={saving}
              style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
              <Check size={13} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {loading ? <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Loading…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Toggles */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Enable verification</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED }}>Require members to verify via website</p>
              </div>
              <Toggle value={enabled} onChange={v => setEnabled(v)} />
            </div>
            <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Block alts</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: MUTED }}>Block accounts sharing an IP</p>
              </div>
              <Toggle value={blockAlts} onChange={v => setBlockAlts(v)} />
            </div>
          </div>

          {/* Role + Channel selectors */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div>
              <div style={subLabel}><Users size={12} /> Verified Role</div>
              <Dropdown value={roleId} onChange={setRoleId} options={rlOpts} placeholder="Select a role…" />
            </div>
            <div>
              <div style={subLabel}><Hash size={12} /> Verification Channel</div>
              <Dropdown value={channelId} onChange={setChannelId} options={chOpts} placeholder="Select a channel…" icon={Hash} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={16} color={GREEN} />
              <span style={{ fontSize: 13 }}><strong style={{ color: TEXT }}>{verifiedCount}</strong> <span style={{ color: MUTED }}>members verified</span></span>
            </div>
            <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10 }}>
              <Globe size={16} color={ACCENT} />
              <span style={{ fontSize: 13, color: MUTED }}>Hosted at <strong style={{ color: ACCENT }}>syntaxx.lol/verify</strong></span>
            </div>
          </div>

          {/* Send message button */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 12px" }}>
              Send (or re-send) the verification embed with button to the selected channel.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={sendMessage} disabled={sending || !channelId}
                style={{ backgroundColor: !channelId ? "#333" : `${BLUE}22`, color: !channelId ? MUTED : BLUE, border: `1px solid ${!channelId ? BORDER : BLUE + "40"}`, borderRadius: 10, padding: "10px 20px", cursor: !channelId ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit", opacity: sending ? 0.7 : 1 }}>
                <Send size={13} /> {sending ? "Sending…" : "Send verification message"}
              </button>
              {!channelId && <span style={{ fontSize: 12, color: MUTED }}>Select a channel first</span>}
              {sendMsg && (
                <span style={{ fontSize: 13, fontWeight: 600, color: sendMsg.ok ? GREEN : RED, display: "flex", alignItems: "center", gap: 5 }}>
                  {sendMsg.ok ? <Check size={13} /> : <X size={13} />} {sendMsg.text}
                </span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const [, params] = useRoute("/dashboard/:id");
  const guildId = params?.id ?? "";

  const [guild,    setGuild]    = useState<GuildInfo | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles,    setRoles]    = useState<Role[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [draft,    setDraft]    = useState<Settings>({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const [saving,       setSaving]       = useState<Record<string, boolean>>({});
  const [saved,        setSaved]        = useState<Record<string, boolean>>({});
  const [dirty,        setDirty]        = useState<Record<string, boolean>>({});
  const [editingCards, setEditingCards] = useState<Record<string, boolean>>({});

  const [editing,    setEditing]    = useState(false);
  const [nick,       setNick]       = useState("");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickSaved,  setNickSaved]  = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!guildId) return;
    Promise.all([
      fetch(`/api/guild/${guildId}`,          { credentials: "include" }).then(r => r.json()),
      fetch(`/api/guild/${guildId}/channels`, { credentials: "include" }).then(r => r.json()),
      fetch(`/api/guild/${guildId}/roles`,    { credentials: "include" }).then(r => r.json()),
      fetch(`/api/guild/${guildId}/settings`, { credentials: "include" }).then(r => r.json()),
    ])
      .then(([g, ch, ro, s]) => {
        if (!g?.name) { setError("Not authorized — please log in first."); setLoading(false); return; }
        setGuild(g); setNick(g.nickname ?? "");
        setChannels(Array.isArray(ch) ? ch : []);
        setRoles(Array.isArray(ro) ? ro : []);
        const clean: Settings = {
          modLogChannel:     s.modLogChannel     ?? "",
          memberLogChannel:  s.memberLogChannel  ?? "",
          messageLogChannel: s.messageLogChannel ?? "",
          autoMod:           s.autoMod           ?? false,
        };
        setSettings(clean);
        setDraft(clean);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load server data"); setLoading(false); });
  }, [guildId]);

  const updateDraft = useCallback((card: string, patch: Partial<Settings>) => {
    setDraft(d => ({ ...d, ...patch }));
    setDirty(prev => ({ ...prev, [card]: true }));
    setSaved(prev => ({ ...prev, [card]: false }));
  }, []);

  function startEdit(card: string) { setEditingCards(e => ({ ...e, [card]: true })); }
  function cancelEdit(card: string, fields: (keyof Settings)[]) {
    setEditingCards(e => ({ ...e, [card]: false }));
    setDirty(prev => ({ ...prev, [card]: false }));
    // Reset draft fields to saved settings
    const reset: Partial<Settings> = {};
    for (const f of fields) reset[f] = settings[f] as never;
    setDraft(d => ({ ...d, ...reset }));
  }

  async function saveCard(card: string, fields: (keyof Settings)[], valueLabel: string) {
    setSaving(s => ({ ...s, [card]: true }));
    const body: Record<string, unknown> = {};
    for (const f of fields) body[f] = draft[f];
    body["_meta"] = {
      serverName:  guild?.name ?? guildId,
      label:       card,
      valueLabel,
      changedAt:   new Date().toISOString(),
    };
    try {
      const res = await fetch(`/api/guild/${guildId}/settings`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved: Partial<Settings> = {};
        for (const f of fields) saved[f] = draft[f] as never;
        setSettings(s => ({ ...s, ...saved }));
        setDirty(prev => ({ ...prev, [card]: false }));
        setSaved(prev => ({ ...prev, [card]: true }));
        setEditingCards(e => ({ ...e, [card]: false }));
        setTimeout(() => setSaved(prev => ({ ...prev, [card]: false })), 4000);
      }
    } finally {
      setSaving(s => ({ ...s, [card]: false }));
    }
  }

  async function saveNickname() {
    setNickSaving(true);
    const res = await fetch(`/api/guild/${guildId}/nickname`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nick, _meta: { serverName: guild?.name, changedAt: new Date().toISOString() } }),
    });
    setNickSaving(false);
    if (res.ok) {
      setGuild(g => g ? { ...g, nickname: nick || null } : g);
      setEditing(false); setNickSaved(true);
      setTimeout(() => setNickSaved(false), 4000);
    }
  }

  // Resolve display labels from IDs
  function channelLabel(id?: string) {
    if (!id) return "Not set";
    const ch = channels.find(c => c.id === id);
    return ch ? `#${ch.name}` : "Not set";
  }

  const channelOptions: DropdownOption[] = channels.map(c => ({
    id: c.id, label: c.name, disabled: !c.botCanAccess, disabledReason: "Bot can't see or send messages here",
  }));

  const inaccessibleCount = channels.filter(c => !c.botCanAccess).length;

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", backgroundColor: "#161616",
    border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px",
    color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "none",
  };

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.95)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/servers" style={{ color: MUTED, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <ArrowLeft size={16} /> My Servers
          </Link>
          {guild && <>
            <span style={{ color: BORDER }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {guild.icon
                ? <img src={guild.icon} style={{ width: 24, height: 24, borderRadius: "50%" }} alt="" />
                : <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#121212" }}>{guild.name[0]}</div>
              }
              <span style={{ fontWeight: 700, fontSize: 15 }}>{guild.name}</span>
            </div>
          </>}
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "24px 14px" : "48px 24px" }}>
        {loading && <p style={{ color: MUTED }}>Loading…</p>}
        {error   && <p style={{ color: RED }}>{error}</p>}

        {guild && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
              {guild.icon
                ? <img src={guild.icon} style={{ width: 64, height: 64, borderRadius: 14 }} alt="" />
                : <div style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#121212" }}>{guild.name[0]}</div>
              }
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{guild.name}</h1>
                <p style={{ color: MUTED, margin: 0, fontSize: 13 }}>Manage Syntaxx settings for this server</p>
              </div>
            </div>

            {/* Perms banner */}
            {inaccessibleCount > 0 && (
              <div style={{ backgroundColor: "#2a1a00", border: "1px solid #ff980040", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <Lock size={14} color={ORANGE} />
                <span style={{ color: ORANGE }}>
                  <strong>{inaccessibleCount} channel{inaccessibleCount > 1 ? "s" : ""}</strong> are hidden from the bot and can't be selected.
                </span>
              </div>
            )}

            {/* ─── ⚙️ General ─────────────────────────────── */}
            <SectionHeader title="General" icon="⚙️" first />

            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 32px", marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? 12 : 0, marginBottom: editing ? 16 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ backgroundColor: `${ACCENT}18`, borderRadius: 8, padding: 8 }}><Edit2 size={18} color={ACCENT} /></div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Bot Nickname</h2>
                    <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Rename Syntaxx in this server</p>
                  </div>
                </div>
                {!editing ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {nickSaved && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Saved</span>}
                    <span style={{ fontSize: 13, fontWeight: 600, color: guild.nickname ? TEXT : MUTED }}>
                      {guild.nickname ?? "Syntaxx (default)"}
                    </span>
                    <button onClick={() => setEditing(true)}
                      style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                      <Pencil size={12} /> Change
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={saveNickname} disabled={nickSaving}
                      style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                      <Check size={13} /> {nickSaving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => { setEditing(false); setNick(guild.nickname ?? ""); }}
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", fontFamily: "inherit" }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {editing && (
                <input value={nick} onChange={e => setNick(e.target.value)} maxLength={32}
                  placeholder="Leave empty to reset to default"
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }} />
              )}
            </div>

            {/* ─── 📋 Logging ─────────────────────────────── */}
            <SectionHeader title="Logging" icon="📋" />

            <SelectorCard
              icon={<BookOpen size={18} color={ORANGE} />} iconColor={ORANGE}
              title="Mod Log Channel" desc="Where bans, kicks and mutes get logged"
              currentLabel={channelLabel(settings.modLogChannel)}
              isEditing={editingCards["modlog"] ?? false}
              onStartEdit={() => startEdit("modlog")}
              onCancelEdit={() => cancelEdit("modlog", ["modLogChannel"])}
              saved={saved["modlog"] ?? false} saving={saving["modlog"] ?? false}
              dirty={dirty["modlog"] ?? false}
              onSave={() => saveCard("modlog", ["modLogChannel"], channelLabel(draft.modLogChannel))}>
              <Dropdown value={draft.modLogChannel ?? ""} onChange={v => updateDraft("modlog", { modLogChannel: v })} options={channelOptions} placeholder="Select a channel…" icon={Hash} />
            </SelectorCard>

            <SelectorCard
              icon={<FileText size={18} color="#2ECC71" />} iconColor="#2ECC71"
              title="Message Log" desc="Log edited and deleted messages to a channel"
              currentLabel={channelLabel(settings.messageLogChannel)}
              isEditing={editingCards["messagelog"] ?? false}
              onStartEdit={() => startEdit("messagelog")}
              onCancelEdit={() => cancelEdit("messagelog", ["messageLogChannel"])}
              saved={saved["messagelog"] ?? false} saving={saving["messagelog"] ?? false}
              dirty={dirty["messagelog"] ?? false}
              onSave={() => saveCard("messagelog", ["messageLogChannel"], channelLabel(draft.messageLogChannel))}>
              <Dropdown value={draft.messageLogChannel ?? ""} onChange={v => updateDraft("messagelog", { messageLogChannel: v })} options={channelOptions} placeholder="Select a channel…" icon={Hash} />
            </SelectorCard>

            <MemberLogSetupCard guildId={guildId} channels={channels} roles={roles} />

            {/* ─── 🛡️ Moderation ──────────────────────────── */}
            <SectionHeader title="Moderation" icon="🛡️" />

            <AutoModCard
              guildId={guildId}
              channels={channels}
              roles={roles}
              serverName={guild.name}
            />

            {/* ─── 📊 Leveling & Economy ───────────────────── */}
            <SectionHeader title="Leveling & Economy" icon="📊" />

            <LevelsCard guildId={guildId} />
            <LevelChannelCard guildId={guildId} channels={channels} />

            {/* ─── 🎉 Fun Commands ─────────────────────────── */}
            <SectionHeader title="Fun Commands" icon="🎉" />

            <FunCard guildId={guildId} />

            {/* ─── ✨ Extra Features ────────────────────────── */}
            <SectionHeader title="Extra Features" icon="✨" />

            <CustomCommandsCard guildId={guildId} />

            {/* ─── 🔐 Verification ─────────────────────────────── */}
            <SectionHeader title="Verification" icon="🔐" />

            <VerificationCard guildId={guildId} channels={channels} roles={roles} />

          </motion.div>
        )}
      </div>
    </div>
  );
}
