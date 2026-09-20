import { useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";

// Three-segment donut: saved (fixed green) / spent (themeable accent) /
// reserved for the rest of the month (fixed neutral grey). Pure SVG +
// stroke-dasharray — cheap to render, no canvas/chart library needed.
function Ring({ size, strokeWidth, saved, spent, reserved }) {
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const total = Math.max(saved + spent + reserved, 0.01);
  const segs = [
    { color: COLORS.teal, frac: Math.max(saved, 0) / total },
    { color: "var(--uf-ink)", frac: Math.max(spent, 0) / total },
    { color: "rgba(var(--uf-ink-rgb),0.28)", frac: Math.max(reserved, 0) / total },
  ];
  let running = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)", display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(var(--uf-ink-rgb),0.10)" strokeWidth={strokeWidth} fill="none" />
      {segs.map((seg, i) => {
        const len = seg.frac * C;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-running}
            style={{ transition: "stroke-dasharray 400ms ease" }}
          />
        );
        running += len;
        return el;
      })}
    </svg>
  );
}

export default function ProgressRing({ savedData, daysRemaining, dailyTarget }) {
  const [open, setOpen] = useState(false);
  const saved = Math.max(savedData.savedSoFar, 0);
  const spent = savedData.totalSpent;
  // Reserved = today's daily target × eligible days not yet reached.
  const reservedAmount = daysRemaining * dailyTarget;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "8px 14px 8px 8px",
          borderRadius: 999,
          border: `1px solid rgba(var(--uf-ink-rgb),0.14)`,
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(14px) saturate(160%)",
          WebkitBackdropFilter: "blur(14px) saturate(160%)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Ring size={40} strokeWidth={5} saved={saved} spent={spent} reserved={reservedAmount} />
        <div style={{ fontFamily: FONT_UI }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
            {CURRENCY} {fmt(saved)} saved
          </div>
          <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.55)" }}>
            {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left · tap for breakdown
          </div>
        </div>
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 70px)",
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
              background: "rgba(237,239,231,0.75)",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "min(340px, 88vw)",
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.9)",
              borderRadius: 20,
              padding: "26px 22px 22px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", cursor: "pointer", color: "rgba(var(--uf-ink-rgb),0.5)" }}
            >
              <X size={18} />
            </button>
            <div style={{ fontFamily: FONT_VOICE, fontSize: 18, color: COLORS.ink, marginBottom: 2 }}>This month</div>
            <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 18 }}>
              {daysRemaining} eligible day{daysRemaining === 1 ? "" : "s"} left
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Ring size={160} strokeWidth={16} saved={saved} spent={spent} reserved={reservedAmount} />
            </div>

            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              <LegendRow color={COLORS.teal} label="Saved" value={saved} />
              <LegendRow color="var(--uf-ink)" label="Spent" value={spent} />
              <LegendRow color="rgba(var(--uf-ink-rgb),0.28)" label="Reserved for later days" value={reservedAmount} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontFamily: FONT_UI }}>
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flex: "none" }} />
      <span style={{ color: COLORS.ink }}>{label}</span>
      <span style={{ marginLeft: "auto", fontFamily: FONT_MONO, color: "rgba(var(--uf-ink-rgb),0.6)" }}>
        {CURRENCY} {fmt(value)}
      </span>
    </div>
  );
}
