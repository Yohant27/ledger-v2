import { COLORS, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { getDailyState } from "../logic.js";

export default function DailyBar({ todaySpent, dailyTarget, warningThreshold, holiday = false }) {
  const state = getDailyState(todaySpent, dailyTarget, warningThreshold);
  const barColor = state === "over" ? COLORS.brick : state === "warning" ? COLORS.gold : COLORS.teal;
  const pct = Math.min((todaySpent / dailyTarget) * 100, 100);
  const markerPct = (warningThreshold / dailyTarget) * 100;
  const over = todaySpent > dailyTarget ? todaySpent - dailyTarget : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI }}>
          Today{holiday && <span style={{ marginLeft: 6, color: COLORS.gold }}>· holiday target</span>}
        </span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.ink }}>
          {CURRENCY} {fmt(todaySpent)} <span style={{ color: "rgba(var(--uf-ink-rgb),0.4)" }}>/ {CURRENCY} {fmt(dailyTarget)}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: 10, background: COLORS.lineSoft, borderRadius: 5, overflow: "visible" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            borderRadius: 5,
            transition: "width 200ms ease, background 200ms ease",
          }}
        />
        <div
          title={`${CURRENCY}${warningThreshold} warning line`}
          style={{
            position: "absolute",
            left: `${markerPct}%`,
            top: -3,
            bottom: -3,
            width: 2,
            background: "rgba(var(--uf-ink-rgb),0.35)",
          }}
        />
      </div>
      {over > 0 && (
        <div style={{ marginTop: 6, fontSize: 11.5, color: COLORS.brick, fontFamily: FONT_UI }}>
          {CURRENCY} {fmt(over)} over target
        </div>
      )}
    </div>
  );
}
