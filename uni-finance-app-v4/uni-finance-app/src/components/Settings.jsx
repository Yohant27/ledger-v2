import { useState } from "react";
import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI, THEME_PRESETS } from "../theme.js";
import { CURRENCY } from "../config.js";

function Field({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", marginBottom: 4, fontFamily: FONT_UI }}>{label}</div>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontFamily: FONT_MONO, color: "rgba(var(--uf-ink-rgb),0.4)" }}>
          {CURRENCY}
        </span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 10px 9px 32px",
            fontFamily: FONT_MONO,
            fontSize: 14,
            borderRadius: 4,
            border: `1px solid ${COLORS.line}`,
            background: "#FBFBF8",
            color: COLORS.ink,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}

function SectionButton({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "11px 12px",
        borderRadius: 6,
        border: `1px solid ${danger ? "rgba(180,72,63,0.4)" : COLORS.line}`,
        background: "transparent",
        color: danger ? COLORS.brick : COLORS.ink,
        fontFamily: FONT_UI,
        fontSize: 13.5,
        cursor: "pointer",
        marginBottom: 8,
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.5)", margin: "16px 0 8px", fontFamily: FONT_UI, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </div>
  );
}

function fmtDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PauseSection({ pauses, today, onAddPause, onEndPause, onRemovePause }) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");

  const entries = pauses.map((p, index) => ({ ...p, index })).sort((a, b) => (a.start < b.start ? 1 : -1));
  const dateInput = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    fontFamily: FONT_UI,
    fontSize: 13,
    borderRadius: 4,
    border: `1px solid ${COLORS.line}`,
    background: "#FBFBF8",
    color: COLORS.ink,
    outline: "none",
  };

  function add() {
    if (!start) return setError("Pick a start date");
    if (end && end < start) return setError("End date can't be before the start date");
    setError("");
    onAddPause({ start, end: end || null });
    setStart(today);
    setEnd("");
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 10, lineHeight: 1.5 }}>
        Paused days (semester breaks) don't count toward your target, so they add no allowance and aren't counted as days left. Spending on them is still recorded and still deducts from savings.
      </div>

      {entries.map((p) => {
        const active = today >= p.start && (p.end == null || today <= p.end);
        const upcoming = p.start > today;
        return (
          <div key={p.index} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 6, border: `1px solid ${COLORS.line}`, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 12.5, color: COLORS.ink, fontFamily: FONT_UI, lineHeight: 1.4 }}>
              {fmtDate(p.start)} → {p.end ? fmtDate(p.end) : "until you resume"}
              <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.5)" }}>{active ? "Paused now" : upcoming ? "Upcoming" : "Past"}</div>
            </div>
            {active && (
              <button onClick={() => onEndPause(p.index)} style={{ border: "none", background: COLORS.ink, color: COLORS.paper, fontFamily: FONT_UI, fontSize: 12, borderRadius: 4, padding: "6px 10px", cursor: "pointer" }}>
                Resume
              </button>
            )}
            <button
              onClick={() => onRemovePause(p.index)}
              aria-label="Remove pause"
              style={{ border: `1px solid ${COLORS.line}`, background: "transparent", color: "rgba(var(--uf-ink-rgb),0.6)", fontFamily: FONT_UI, fontSize: 12, borderRadius: 4, padding: "6px 10px", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 4 }}>From</div>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={dateInput} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 4 }}>Until (optional)</div>
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} style={dateInput} />
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.brick, marginBottom: 8, fontFamily: FONT_UI }}>{error}</div>}
      <button
        onClick={add}
        style={{ width: "100%", padding: "10px 0", borderRadius: 6, border: `1px solid ${COLORS.ink}`, background: "transparent", color: COLORS.ink, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        {end ? "Add pause" : "Pause until I resume"}
      </button>
    </div>
  );
}

function HolidaySection({ periods, today, dailyTarget, onAddPeriod, onEndPeriod, onRemovePeriod }) {
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const entries = periods.map((p, index) => ({ ...p, index })).sort((a, b) => (a.start < b.start ? 1 : -1));
  const dateInput = {
    width: "100%",
    boxSizing: "border-box",
    padding: "9px 10px",
    fontFamily: FONT_UI,
    fontSize: 13,
    borderRadius: 4,
    border: `1px solid ${COLORS.line}`,
    background: "#FBFBF8",
    color: COLORS.ink,
    outline: "none",
  };

  function add() {
    const target = parseFloat(amount);
    if (isNaN(target) || target <= 0) return setError("Enter a daily target for the trip");
    if (!start) return setError("Pick a start date");
    if (end && end < start) return setError("End date can't be before the start date");
    setError("");
    onAddPeriod({ start, end: end || null, target });
    setStart(today);
    setEnd("");
    setAmount("");
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 10, lineHeight: 1.5 }}>
        Going on a trip? Set a different daily target just for those dates (your normal target is {CURRENCY}{dailyTarget}). The daily bar, saved-so-far and the days table all use it for those days only.
      </div>

      {entries.map((p) => {
        const active = today >= p.start && (p.end == null || today <= p.end);
        const upcoming = p.start > today;
        return (
          <div key={p.index} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 6, border: `1px solid ${COLORS.line}`, marginBottom: 8 }}>
            <div style={{ flex: 1, fontSize: 12.5, color: COLORS.ink, fontFamily: FONT_UI, lineHeight: 1.4 }}>
              {CURRENCY} {p.target}/day · {fmtDate(p.start)} → {p.end ? fmtDate(p.end) : "until you end it"}
              <div style={{ fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.5)" }}>{active ? "Active now" : upcoming ? "Upcoming" : "Past"}</div>
            </div>
            {active && (
              <button onClick={() => onEndPeriod(p.index)} style={{ border: "none", background: COLORS.ink, color: COLORS.paper, fontFamily: FONT_UI, fontSize: 12, borderRadius: 4, padding: "6px 10px", cursor: "pointer" }}>
                End
              </button>
            )}
            <button
              onClick={() => onRemovePeriod(p.index)}
              aria-label="Remove holiday target"
              style={{ border: `1px solid ${COLORS.line}`, background: "transparent", color: "rgba(var(--uf-ink-rgb),0.6)", fontFamily: FONT_UI, fontSize: 12, borderRadius: 4, padding: "6px 10px", cursor: "pointer" }}
            >
              Remove
            </button>
          </div>
        );
      })}

      <Field label="Daily target for the trip" value={amount} onChange={setAmount} />
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 4 }}>From</div>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={dateInput} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 4 }}>Until (optional)</div>
          <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} style={dateInput} />
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.brick, marginBottom: 8, fontFamily: FONT_UI }}>{error}</div>}
      <button
        onClick={add}
        style={{ width: "100%", padding: "10px 0", borderRadius: 6, border: `1px solid ${COLORS.ink}`, background: "transparent", color: COLORS.ink, fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        {end ? "Set holiday target" : "Set target until I end it"}
      </button>
    </div>
  );
}

export default function Settings({
  dailyTarget,
  warningThreshold,
  onSaveTargets,
  pauses,
  today,
  onAddPause,
  onEndPause,
  onRemovePause,
  targetPeriods,
  onAddPeriod,
  onEndPeriod,
  onRemovePeriod,
  accentTheme,
  onSetAccentTheme,
  onOpenTable,
  onReplayTutorial,
  onDeleteAll,
}) {
  const [targetInput, setTargetInput] = useState(String(dailyTarget));
  const [warningInput, setWarningInput] = useState(String(warningThreshold));
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  function saveTargets() {
    const t = parseFloat(targetInput);
    const w = parseFloat(warningInput);
    if (isNaN(t) || t <= 0 || isNaN(w) || w < 0 || w > t) return;
    onSaveTargets({ dailyTarget: t, warningThreshold: w });
  }

  return (
    <div>
      <div style={{ fontFamily: FONT_VOICE, fontSize: 17, color: COLORS.ink, marginBottom: 16 }}>Settings</div>

      <SectionLabel>Daily target</SectionLabel>
      <Field label="Daily spending target" value={targetInput} onChange={setTargetInput} />
      <Field label="Warning threshold" value={warningInput} onChange={setWarningInput} />
      <button
        onClick={saveTargets}
        style={{
          width: "100%",
          padding: "10px 0",
          borderRadius: 6,
          border: "none",
          background: COLORS.ink,
          color: COLORS.paper,
          fontFamily: FONT_UI,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        Save
      </button>

      <SectionLabel>Semester break</SectionLabel>
      <PauseSection pauses={pauses} today={today} onAddPause={onAddPause} onEndPause={onEndPause} onRemovePause={onRemovePause} />

      <SectionLabel>Holiday target</SectionLabel>
      <HolidaySection periods={targetPeriods} today={today} dailyTarget={dailyTarget} onAddPeriod={onAddPeriod} onEndPeriod={onEndPeriod} onRemovePeriod={onRemovePeriod} />

      <SectionLabel>Appearance</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {THEME_PRESETS.map((t) => (
          <button
            key={t.key}
            onClick={() => onSetAccentTheme(t.key)}
            title={t.name}
            aria-label={t.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: t.swatch,
              border: accentTheme === t.key ? `2px solid ${COLORS.ink}` : "2px solid transparent",
              boxShadow: accentTheme === t.key ? "0 0 0 2px #fff inset" : "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>

      <SectionLabel>History</SectionLabel>
      <SectionButton label="All days table (every month) →" onClick={onOpenTable} />

      <SectionLabel>Help</SectionLabel>
      <SectionButton label="Replay tutorial" onClick={onReplayTutorial} />

      <SectionLabel>Backup</SectionLabel>
      <div style={{ fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 16, lineHeight: 1.5 }}>
        This app is local-only — your data never leaves this device. Use the Excel export in the All days table regularly as your backup.
      </div>

      <SectionLabel>Danger zone</SectionLabel>
      {!deleteConfirm ? (
        <SectionButton label="Delete all data" onClick={() => setDeleteConfirm(true)} danger />
      ) : (
        <div style={{ padding: 12, borderRadius: 6, border: `1px solid rgba(180,72,63,0.4)`, background: "rgba(180,72,63,0.06)" }}>
          <div style={{ fontSize: 12.5, color: COLORS.ink, fontFamily: FONT_UI, marginBottom: 10 }}>
            This permanently deletes every transaction and setting on this device. This can't be undone — make sure you've exported anything you want to keep first.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setDeleteConfirm(false)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: `1px solid ${COLORS.line}`, background: "transparent", color: "rgba(var(--uf-ink-rgb),0.6)", fontFamily: FONT_UI, fontSize: 12.5, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={onDeleteAll}
              style={{ flex: 1, padding: "8px 0", borderRadius: 4, border: "none", background: COLORS.brick, color: "#fff", fontFamily: FONT_UI, fontSize: 12.5, cursor: "pointer" }}
            >
              Yes, delete everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
