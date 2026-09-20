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

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: "none",
        padding: 3,
        background: checked ? COLORS.ink : "rgba(var(--uf-ink-rgb),0.2)",
        cursor: "pointer",
        flex: "none",
        transition: "background 200ms ease",
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 200ms ease",
        }}
      />
    </button>
  );
}

export default function Settings({
  dailyTarget,
  warningThreshold,
  onSaveTargets,
  strictSavings,
  onToggleStrictSavings,
  accentTheme,
  onSetAccentTheme,
  onOpenMonth,
  onOpenPreviousMonths,
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

      <SectionLabel>Saved so far</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 2px 4px", marginBottom: 8 }}>
        <Toggle checked={!!strictSavings} onChange={onToggleStrictSavings} />
        <div style={{ fontSize: 13, color: COLORS.ink, fontFamily: FONT_UI, lineHeight: 1.4 }}>
          Weekend spending counts against savings
        </div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 20, lineHeight: 1.5 }}>
        {strictSavings
          ? "On — spending on excluded days (like weekends) still deducts from your saved total."
          : "Off — spending on excluded days (like weekends) is free and doesn't touch your saved total."}
      </div>

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
      <SectionButton label="This month's full transaction list →" onClick={onOpenMonth} />
      <SectionButton label="Previous months →" onClick={onOpenPreviousMonths} />

      <SectionLabel>Help</SectionLabel>
      <SectionButton label="Replay tutorial" onClick={onReplayTutorial} />

      <SectionLabel>Backup</SectionLabel>
      <div style={{ fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 16, lineHeight: 1.5 }}>
        This app is local-only — your data never leaves this device. Use the Excel export above regularly (This month's full transaction list, or Previous months) as your backup.
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
