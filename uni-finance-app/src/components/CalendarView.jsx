import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_UI } from "../theme.js";
import { toDateStr, isDayIncluded, isPaused, daysInMonth, todayStr } from "../logic.js";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarView({ daySettingsMap, pauses = [], onToggleDay, onSetRange }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today = todayStr();
  const numDays = daysInMonth(cursor.year, cursor.month);
  const firstOfMonth = new Date(cursor.year, cursor.month, 1);
  // Convert JS getDay() (0=Sun) to Mon-first index (0=Mon..6=Sun)
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  function dateStrFor(day) {
    return toDateStr(new Date(cursor.year, cursor.month, day));
  }

  function changeMonth(delta) {
    let m = cursor.month + delta;
    let y = cursor.year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setCursor({ year: y, month: m });
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  function applyPreset(preset) {
    const dates = [];
    for (let d = 1; d <= numDays; d++) dates.push(dateStrFor(d));
    onSetRange(dates, preset);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => changeMonth(-1)} style={navBtnStyle}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontFamily: FONT_VOICE, fontSize: 16, color: COLORS.ink }}>{monthLabel}</span>
        <button onClick={() => changeMonth(1)} style={navBtnStyle}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <PresetButton label="Weekdays" onClick={() => applyPreset("weekdays")} />
        <PresetButton label="Every day" onClick={() => applyPreset("all")} />
        <PresetButton label="None" onClick={() => applyPreset("none")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: "rgba(var(--uf-ink-rgb),0.4)", fontFamily: FONT_UI }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const dateStr = dateStrFor(day);
          const included = isDayIncluded(dateStr, daySettingsMap, pauses);
          const paused = !included && isPaused(dateStr, pauses);
          const isFuture = dateStr > today;
          const isToday = dateStr === today;
          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => onToggleDay(dateStr, !included)}
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                border: isToday
                  ? `1.5px solid ${COLORS.gold}`
                  : paused && !isFuture
                  ? `1px dashed rgba(var(--uf-ink-rgb),0.35)`
                  : `1px solid ${COLORS.line}`,
                background: isFuture
                  ? "transparent"
                  : included
                  ? COLORS.ink
                  : paused
                  ? "repeating-linear-gradient(45deg, rgba(var(--uf-ink-rgb),0.12) 0 4px, transparent 4px 8px)"
                  : "transparent",
                color: isFuture ? "rgba(var(--uf-ink-rgb),0.25)" : included ? COLORS.paper : "rgba(var(--uf-ink-rgb),0.5)",
                fontFamily: FONT_UI,
                fontSize: 12,
                cursor: isFuture ? "default" : "pointer",
                opacity: isFuture ? 0.5 : 1,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 14, fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI }}>
        <span><Swatch filled /> Included</span>
        <span><Swatch /> Excluded</span>
        <span><Swatch paused /> Paused</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.45)", fontFamily: FONT_UI }}>
        Tap any past or present day to toggle it. Paused days (semester breaks) show striped — tap one to count it anyway. Spending is always recorded either way.
      </div>
    </div>
  );
}

function Swatch({ filled, paused }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 3,
        marginRight: 4,
        verticalAlign: "middle",
        border: paused ? `1px dashed rgba(var(--uf-ink-rgb),0.35)` : `1px solid ${COLORS.line}`,
        background: filled
          ? COLORS.ink
          : paused
          ? "repeating-linear-gradient(45deg, rgba(var(--uf-ink-rgb),0.12) 0 3px, transparent 3px 6px)"
          : "transparent",
      }}
    />
  );
}

function PresetButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        fontSize: 11.5,
        fontFamily: FONT_UI,
        borderRadius: 20,
        border: `1px solid ${COLORS.line}`,
        background: "transparent",
        color: "rgba(var(--uf-ink-rgb),0.6)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const navBtnStyle = {
  border: "none",
  background: "none",
  cursor: "pointer",
  color: COLORS.ink,
  padding: 6,
  display: "flex",
};
