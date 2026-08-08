import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import logoUrl from "/syntaxx-logo.png";

const ACCENT = "#B8A05B";
const BG     = "#121212";
const CARD   = "#1e1e1e";
const BORDER = "#2e2e2e";
const TEXT   = "#eeeeee";
const MUTED  = "#888888";
const GREEN  = "#57F287";
const RED    = "#ED4245";
const ORANGE = "#FFA500";

interface TokenInfo {
  valid:     boolean;
  reason?:   string;
  guildName?: string;
  guildIcon?: string | null;
  username?:  string;
  avatar?:    string | null;
}

type Stage = "loading" | "ready" | "verifying" | "success" | "error" | "invalid";

export default function Verify() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [info,      setInfo]      = useState<TokenInfo | null>(null);
  const [stage,     setStage]     = useState<Stage>("loading");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [roleName,  setRoleName]  = useState("Verified");

  useEffect(() => {
    if (!token) { setStage("invalid"); return; }

    fetch(`/api/verify/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((d: TokenInfo) => {
        setInfo(d);
        setStage(d.valid ? "ready" : "invalid");
        if (!d.valid) setErrorMsg(d.reason ?? "Invalid link.");
      })
      .catch(() => { setStage("invalid"); setErrorMsg("Could not reach the server. Please try again."); });
  }, [token]);

  async function doVerify() {
    setStage("verifying");
    try {
      const res  = await fetch(`/api/verify/${encodeURIComponent(token)}`, { method: "POST" });
      const data = await res.json() as { ok: boolean; error?: string; roleName?: string };
      if (data.ok) {
        setRoleName(data.roleName ?? "Verified");
        setStage("success");
      } else {
        setErrorMsg(data.error ?? "Verification failed.");
        setStage("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStage("error");
    }
  }

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: "rgba(18,18,18,0.95)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <img src={logoUrl} alt="Syntaxx" style={{ height: 28 }} />
        </Link>
        <span style={{ fontSize: 13, color: MUTED }}>IP Verification</span>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>

          {/* ── Loading ── */}
          {stage === "loading" && (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={40} color={ACCENT} style={{ animation: "spin 1s linear infinite", marginBottom: 16 }} />
              <p style={{ color: MUTED }}>Validating your link…</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Invalid / expired ── */}
          {stage === "invalid" && (
            <div style={{ backgroundColor: CARD, border: `1px solid ${RED}40`, borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
              <XCircle size={52} color={RED} style={{ marginBottom: 20 }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Link Invalid</h1>
              <p style={{ color: MUTED, lineHeight: 1.7, margin: "0 0 28px" }}>{errorMsg || "This verification link is invalid or has already been used."}</p>
              <p style={{ color: MUTED, fontSize: 14 }}>Go back to Discord and click <strong>Verify</strong> again to get a new link.</p>
            </div>
          )}

          {/* ── Ready to verify ── */}
          {stage === "ready" && info && (
            <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "40px 36px" }}>
              {/* Guild header */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                {info.guildIcon
                  ? <img src={info.guildIcon} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
                  : <div style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: `${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: ACCENT }}>{info.guildName?.[0] ?? "?"}</div>
                }
                <div>
                  <p style={{ color: MUTED, fontSize: 12, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Verifying for</p>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{info.guildName}</h2>
                </div>
              </div>

              {/* User */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 16px", marginBottom: 24 }}>
                {info.avatar
                  ? <img src={info.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                  : <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#121212" }}>{info.username?.[0]?.toUpperCase()}</div>
                }
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{info.username}</p>
                  <p style={{ margin: 0, fontSize: 12, color: MUTED }}>Your Discord account</p>
                </div>
              </div>

              {/* What happens */}
              <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", marginBottom: 28 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em" }}>What happens when you verify</p>
                {[
                  "Your IP address is hashed (anonymised) and stored",
                  "A verified role is assigned to your Discord account",
                  "Accounts sharing your IP cannot verify in this server",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 6 }}>
                    <ShieldCheck size={13} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>

              <button onClick={doVerify}
                style={{ width: "100%", backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 12, padding: "15px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ShieldCheck size={18} /> Complete Verification
              </button>
              <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "14px 0 0" }}>
                This link expires after use. Only you can see this page.
              </p>
            </div>
          )}

          {/* ── Verifying (spinner) ── */}
          {stage === "verifying" && (
            <div style={{ textAlign: "center" }}>
              <Loader2 size={48} color={ACCENT} style={{ animation: "spin 1s linear infinite", marginBottom: 20 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Verifying…</h2>
              <p style={{ color: MUTED }}>Checking your IP and assigning your role…</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── Success ── */}
          {stage === "success" && (
            <div style={{ backgroundColor: CARD, border: `1px solid ${GREEN}40`, borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
              <CheckCircle2 size={60} color={GREEN} style={{ marginBottom: 20 }} />
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 10px" }}>Verification Complete!</h1>
              <p style={{ color: MUTED, lineHeight: 1.7, margin: "0 0 20px" }}>
                You've been given the <strong style={{ color: TEXT }}>@{roleName}</strong> role.<br />
                You can now close this tab and return to Discord.
              </p>
              <div style={{ backgroundColor: "#161616", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 20px", display: "inline-block" }}>
                <span style={{ fontSize: 13, color: MUTED }}>You're verified in </span>
                <strong style={{ color: ACCENT }}>{info?.guildName ?? "the server"}</strong>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {stage === "error" && (
            <div style={{ backgroundColor: CARD, border: `1px solid ${ORANGE}40`, borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
              <AlertTriangle size={52} color={ORANGE} style={{ marginBottom: 20 }} />
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px" }}>Verification Failed</h1>
              <p style={{ color: MUTED, lineHeight: 1.7, margin: "0 0 24px" }}>{errorMsg}</p>
              {errorMsg.includes("IP") ? (
                <p style={{ color: MUTED, fontSize: 14 }}>
                  If you believe this is a mistake, contact a server admin.
                </p>
              ) : (
                <button onClick={doVerify}
                  style={{ backgroundColor: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}40`, borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 600 }}>
                  Try again
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
