import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
      <span style={{ color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, color: color || COLORS.ink }}>
        {CURRENCY} {fmt(value)}
      </span>
    </div>
  );
}

export default function SavedSoFar({ data, daysRemaining }) {
  const { eligibleDays, targetAllowance, spendingOnEligibleDays, spendingOnExcludedDays, totalSpent, extraAdded = 0, savedSoFar } = data;
  const positive = savedSoFar >= 0;

  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", marginBottom: 4, fontFamily: FONT_UI }}>
        Saved so far this month
      </div>
      <div
        style={{
          fontFamily: FONT_VOICE,
          fontSize: 32,
          fontWeight: 600,
          color: positive ? COLORS.teal : COLORS.brick,
          lineHeight: 1,
          marginBottom: 10,
        }}
      >
        {positive ? "" : "-"}{CURRENCY} {fmt(Math.abs(savedSoFar))}
      </div>
      <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 6 }}>
        <Row label={`Target allowance (${eligibleDays} eligible day${eligibleDays === 1 ? "" : "s"})`} value={targetAllowance} />
        <Row label="Spent on eligible days" value={spendingOnEligibleDays} color={COLORS.brick} />
        <Row label="Spent on excluded days" value={spendingOnExcludedDays} color="rgba(var(--uf-ink-rgb),0.5)" />
        <Row label="Total spent this month" value={totalSpent} />
        <Row label="Extra money added" value={extraAdded} color={extraAdded > 0 ? COLORS.teal : undefined} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
          <span style={{ color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI }}>Eligible days left this month</span>
          <span style={{ fontFamily: FONT_MONO, color: COLORS.ink }}>{daysRemaining}</span>
        </div>
      </div>
    </div>
  );
}
