import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { COLORS, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { recentDatesBefore, isDayIncluded, isPaused, getDailyState, getDayLimits } from "../logic.js";
import TodayList from "./TodayList.jsx";

function dayLabel(dateStr, yesterdayStr) {
  if (dateStr === yesterdayStr) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const STATE_COLOR = {
  over: COLORS.brick,
  warning: COLORS.gold,
  normal: COLORS.teal,
};

export default function RecentDays({ transactions, daySettingsMap, pauses = [], targetPeriods = [], today, onDelete, dailyTarget, warningThreshold, count = 6 }) {
  const [expanded, setExpanded] = useState(null);
  const dates = recentDatesBefore(today, count);
  const yesterdayStr = dates[0];

  return (
    <div>
      {dates.map((dateStr) => {
        const dayTxns = transactions.filter((t) => t.date === dateStr);
        const spent = dayTxns
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        const included = isDayIncluded(dateStr, daySettingsMap, pauses);
        const paused = !included && isPaused(dateStr, pauses);
        const limits = getDayLimits(dateStr, targetPeriods, dailyTarget, warningThreshold);
        const state = getDailyState(spent, limits.target, limits.warning);
        const isOpen = expanded === dateStr;

        return (
          <div key={dateStr} style={{ borderBottom: `1px solid ${COLORS.lineSoft}` }}>
            <button
              onClick={() => setExpanded(isOpen ? null : dateStr)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 0",
                border: "none",
                background: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ flex: 1, fontSize: 13, color: COLORS.ink, fontFamily: FONT_UI }}>
                {dayLabel(dateStr, yesterdayStr)}
                {!included && (
                  <span style={{ fontSize: 10, color: "rgba(var(--uf-ink-rgb),0.4)", marginLeft: 6 }}>{paused ? "paused" : "excluded"}</span>
                )}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: dayTxns.length ? STATE_COLOR[state] : "rgba(var(--uf-ink-rgb),0.35)" }}>
                {dayTxns.length ? `${CURRENCY} ${fmt(spent)}` : "—"}
              </span>
              {isOpen ? <ChevronUp size={14} color="rgba(var(--uf-ink-rgb),0.4)" /> : <ChevronDown size={14} color="rgba(var(--uf-ink-rgb),0.4)" />}
            </button>
            {isOpen && (
              <div style={{ paddingBottom: 6 }}>
                <TodayList transactions={dayTxns} onDelete={onDelete} emptyText="Nothing logged this day." />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
