import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ExternalLink, Settings } from "lucide-react";
import { motion } from "framer-motion";
import logoUrl from "/syntaxx-logo.png";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#2a2a2a";
const BORDER = "#383838";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";

interface User {
  id: string;
  username: string;
  avatar: string | null;
}
interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

const INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID ?? ""}&permissions=8&scope=bot%20applications.commands`;

export default function Servers() {
  const [user, setUser]   = useState<User | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then((d: { user: User | null; guilds: Guild[] }) => {
        if (!d.user) { setLocation("/"); return; }
        setUser(d.user);
        setGuilds(d.guilds);
        setLoading(false);
      })
      .catch(() => setLocation("/"));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLocation("/");
  }

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.95)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto" }} />
          </Link>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {user.avatar
                ? <img src={user.avatar} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                : <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#121212", fontSize: 14 }}>{user.username.charAt(0).toUpperCase()}</div>
              }
              <span style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</span>
              <button onClick={logout}
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>Your Servers</h1>
        <p style={{ color: MUTED, margin: "0 0 40px", fontSize: 15 }}>
          Servers where you're an admin or owner and Syntaxx is active
        </p>

        {loading && <p style={{ color: MUTED }}>Loading your servers...</p>}

        {!loading && guilds.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ color: MUTED, marginBottom: 24 }}>No servers found with Syntaxx. Invite the bot first!</p>
            <a href={INVITE_URL} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: ACCENT, color: "#121212", padding: "12px 28px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 15 }}>
              Invite Syntaxx <ExternalLink size={15} />
            </a>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {guilds.map((guild, i) => (
            <motion.div key={guild.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {guild.icon
                  ? <img src={guild.icon} style={{ width: 52, height: 52, borderRadius: 12 }} />
                  : <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: ACCENT + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: ACCENT }}>{guild.name[0]}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{guild.name}</div>
                  <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>ID: {guild.id}</div>
                </div>
              </div>
              <Link href={`/dashboard/${guild.id}`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(184,160,91,0.1)", color: ACCENT, border: `1px solid rgba(184,160,91,0.25)`, borderRadius: 8, padding: "10px", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                <Settings size={15} /> Manage
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
