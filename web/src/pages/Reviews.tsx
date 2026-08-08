import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Star, Heart, LogIn, Menu, X, BookOpen, MessageSquareText, Pencil, Trash2, Loader2,
} from "lucide-react";
import logoUrl from "/syntaxx-logo.png";

const ACCENT  = "#B8A05B";
const BG      = "#121212";
const CARD    = "#1e1e1e";
const BORDER  = "#2e2e2e";
const TEXT    = "#eeeeee";
const MUTED   = "#888888";
const RED     = "#e74c3c";

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

interface ReviewDto {
  id:               string;
  discordId:        string;
  discordUsername:  string;
  discordAvatar:    string | null;
  rating:           number;
  content:          string;
  createdAt:        string;
  likeCount:        number;
  likedByMe:        boolean;
}

function mapReview(r: Record<string, unknown>): ReviewDto {
  return {
    id:              r.id as string,
    discordId:       r.discord_id as string,
    discordUsername: r.discord_username as string,
    discordAvatar:   (r.discord_avatar as string | null) ?? null,
    rating:          Number(r.rating),
    content:         r.content as string,
    createdAt:       r.created_at as string,
    likeCount:       Number(r.like_count ?? 0),
    likedByMe:        Boolean(r.liked_by_me),
  };
}

function useReviews() {
  const [items, setItems]     = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/reviews", { credentials: "include" })
      .then(r => r.json())
      .then((d: { reviews?: Array<Record<string, unknown>> }) => {
        setItems((d.reviews ?? []).map(mapReview));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { items, loading, reload: load };
}

function StarRow({ rating, size = 15, interactive, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={size}
          fill={n <= rating ? ACCENT : "none"}
          color={n <= rating ? ACCENT : BORDER}
          style={{ cursor: interactive ? "pointer" : "default" }}
          onClick={interactive && onChange ? () => onChange(n) : undefined}
        />
      ))}
    </div>
  );
}

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%", backgroundColor: ACCENT, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 700, color: "#121212",
    }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function WriteReviewModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [rating, setRating]       = useState(5);
  const [content, setContent]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) { setError("Please write something before submitting."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, content: content.trim() }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Failed to submit review");
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      setError("Failed to submit review");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Write a Review</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        <label style={{ fontSize: 13, color: MUTED, fontWeight: 600, display: "block", marginBottom: 8 }}>Your rating</label>
        <div style={{ marginBottom: 18 }}>
          <StarRow rating={rating} size={28} interactive onChange={setRating} />
        </div>

        <label style={{ fontSize: 13, color: MUTED, fontWeight: 600, display: "block", marginBottom: 8 }}>Your review</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Tell us what you think about Syntaxx…"
          maxLength={1000}
          rows={5}
          style={{ width: "100%", boxSizing: "border-box", backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", marginBottom: 6 }}
        />
        <div style={{ textAlign: "right", fontSize: 11, color: MUTED, marginBottom: 14 }}>{content.length}/1000</div>

        {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {submitting && <Loader2 size={16} className="spin" />}
          {submitting ? "Submitting…" : "Submit Review"}
        </button>
      </div>
    </div>
  );
}

function EditReviewModal({ review, onClose, onSaved }: { review: ReviewDto; onClose: () => void; onSaved: () => void }) {
  const [rating, setRating]         = useState(review.rating);
  const [content, setContent]       = useState(review.content);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const submit = async () => {
    if (!content.trim()) { setError("Content cannot be empty."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, content: content.trim() }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Failed to update review");
        setSubmitting(false);
        return;
      }
      onSaved();
    } catch {
      setError("Failed to update review");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Edit Review</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        <label style={{ fontSize: 13, color: MUTED, fontWeight: 600, display: "block", marginBottom: 8 }}>Rating</label>
        <div style={{ marginBottom: 18 }}>
          <StarRow rating={rating} size={28} interactive onChange={setRating} />
        </div>

        <label style={{ fontSize: 13, color: MUTED, fontWeight: 600, display: "block", marginBottom: 8 }}>Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={1000}
          rows={5}
          style={{ width: "100%", boxSizing: "border-box", backgroundColor: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, color: TEXT, fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", marginBottom: 14 }}
        />

        {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}>
          {submitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ review, isOwner, currentUserId, isMobile, onLike, onEdit, onDelete }: {
  review: ReviewDto;
  isOwner: boolean;
  currentUserId: string | null;
  isMobile: boolean;
  onLike: (id: string) => void;
  onEdit: (r: ReviewDto) => void;
  onDelete: (r: ReviewDto) => void;
}) {
  const canManage = isOwner;
  const likedByMe = review.likedByMe;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: isMobile ? 16 : 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar url={review.discordAvatar} name={review.discordUsername} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>
                {review.discordUsername}
                {review.discordId === currentUserId && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: ACCENT, backgroundColor: "rgba(184,160,91,0.12)", border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: "1px 6px" }}>You</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {new Date(review.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </div>
            </div>
            <StarRow rating={review.rating} />
          </div>
          <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.6, margin: "12px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {review.content}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
            <button onClick={() => onLike(review.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer",
                color: likedByMe ? RED : MUTED, fontSize: 13, fontWeight: 600, padding: "4px 0", fontFamily: "inherit",
              }}>
              <Heart size={16} fill={likedByMe ? RED : "none"} />
              {review.likeCount}
            </button>
            {canManage && (
              <>
                <button onClick={() => onEdit(review)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 13, fontWeight: 600, padding: "4px 0", fontFamily: "inherit" }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => onDelete(review)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: RED, fontSize: 13, fontWeight: 600, padding: "4px 0", fontFamily: "inherit" }}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Reviews() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [showMenu, setShowMenu] = useState(false);
  const [showWrite, setShowWrite] = useState(false);
  const [editing, setEditing]     = useState<ReviewDto | null>(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const { user, isOwner } = useAuth();
  const { items, loading, reload } = useReviews();

  const myReview = items.find(r => r.discordId === user?.id);

  const like = async (id: string) => {
    if (!user) { window.location.href = "/api/auth/login"; return; }
    await fetch(`/api/reviews/${id}/like`, { method: "POST", credentials: "include" });
    reload();
  };

  const remove = async (r: ReviewDto) => {
    if (!window.confirm(`Delete the review from ${r.discordUsername}?`)) return;
    await fetch(`/api/reviews/${r.id}`, { method: "DELETE", credentials: "include" });
    reload();
  };

  const avgRating = items.length ? items.reduce((a, r) => a + r.rating, 0) / items.length : 0;

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(12px)", backgroundColor: "rgba(18,18,18,0.9)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <img src={logoUrl} alt="Syntaxx" style={{ height: 28, width: "auto" }} />
            {!isMobile && <span style={{ color: TEXT, fontWeight: 700, fontSize: 15 }}>syntaxx</span>}
          </Link>
          <div style={{ display: "flex", gap: isMobile ? 6 : 16, alignItems: "center", flexShrink: 0 }}>
            {!isMobile && <>
              <Link href="/"         style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Home</Link>
              <Link href="/commands" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Commands</Link>
              <Link href="/lore" style={{ color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen size={15} /> Lore
              </Link>
              <Link href="/reviews" style={{ color: TEXT, textDecoration: "none", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <MessageSquareText size={15} /> Reviews
              </Link>
            </>}
            {isMobile && (
              <button onClick={() => setShowMenu(v => !v)}
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 8px", color: TEXT, cursor: "pointer", display: "flex", alignItems: "center" }}>
                {showMenu ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
            {user ? (
              <Link href="/servers" style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.06)", padding: isMobile ? "5px 8px" : "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, textDecoration: "none", color: TEXT, fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                <Avatar url={user.avatar} name={user.username} size={24} />
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
            <Link href="/" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Home</Link>
            <Link href="/commands" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8 }}>Commands</Link>
            <Link href="/lore" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={16} /> Lore
            </Link>
            <Link href="/reviews" onClick={() => setShowMenu(false)} style={{ color: TEXT, textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "10px 8px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquareText size={16} /> Reviews
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "48px 16px 28px" : "72px 24px 40px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(184,160,91,0.1)", border: `1px solid rgba(184,160,91,0.3)`, borderRadius: 999, padding: "5px 14px", marginBottom: 20, fontSize: 12, color: ACCENT, fontWeight: 600 }}>
            <MessageSquareText size={13} /> Community Reviews
          </div>
          <h1 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-1.5px" }}>
            What people <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #d4b87a)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>are saying</span>
          </h1>
          {items.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
              <StarRow rating={Math.round(avgRating)} size={20} />
              <span style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>{avgRating.toFixed(1)}</span>
              <span style={{ color: MUTED, fontSize: 14 }}>({items.length} review{items.length !== 1 ? "s" : ""})</span>
            </div>
          )}
          <p style={{ color: MUTED, fontSize: 15, margin: "8px auto 0", maxWidth: 480 }}>
            Real feedback from real members of the Syntaxx community.
          </p>

          <div style={{ marginTop: 24 }}>
            {!user ? (
              <button onClick={() => { window.location.href = "/api/auth/login"; }}
                style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
                <LogIn size={15} /> Login to leave a review
              </button>
            ) : myReview ? (
              <div style={{ color: MUTED, fontSize: 13 }}>You've already left a review below. Thanks for the feedback!</div>
            ) : (
              <button onClick={() => setShowWrite(true)}
                style={{ backgroundColor: ACCENT, color: "#121212", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
                <MessageSquareText size={15} /> Write a Review
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── Review list ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: `0 ${isMobile ? 16 : 24}px 80px` }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>Loading reviews…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
            <MessageSquareText size={32} color="#444" style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15 }}>No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map(r => (
              <ReviewCard
                key={r.id}
                review={r}
                isOwner={isOwner}
                currentUserId={user?.id ?? null}
                isMobile={isMobile}
                onLike={like}
                onEdit={setEditing}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </section>

      {showWrite && (
        <WriteReviewModal
          onClose={() => setShowWrite(false)}
          onSaved={() => { setShowWrite(false); reload(); }}
        />
      )}
      {editing && (
        <EditReviewModal
          review={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}
