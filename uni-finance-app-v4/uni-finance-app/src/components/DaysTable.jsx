import { useMemo, useState } from "react";
import { Download, ArrowUp, ArrowDown } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { getMonthDayRows, getDailyState, tableMonthKeys, monthKeyOf } from "../logic.js";
import { exportDaysToExcel } from "../exportExcel.js";
import TodayList from "./TodayList.jsx";

function monthLabelFor(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function dateLabel(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

const STATUS_LABEL = { included: "Included", excluded: "Excluded", paused: "Paused" };
const STATE_COLOR = { over: COLORS.brick, warning: COLORS.gold, normal: COLORS.teal };

const th = {
  textAlign: "right",
  padding: "7px 8px",
  fontSize: 10.5,
  fontWeight: 500,
  fontFamily: FONT_UI,
  color: "rgba(var(--uf-ink-rgb),0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: `1px solid ${COLORS.line}`,
  whiteSpace: "nowrap",
  background: COLORS.paper,
};
const td = { padding: "8px 8px", fontSize: 12.5, textAlign: "right", whiteSpace: "nowrap", borderBottom: `1px solid ${COLORS.lineSoft}` };
const stickyFirst = { position: "sticky", left: 0, background: COLORS.paper, zIndex: 1, textAlign: "left" };

export default function DaysTable({ transactions, daySettingsMap, pauses, targetPeriods = [], dailyTarget, warningThreshold, settings, today, onDelete, onBack }) {
  const monthKeys = useMemo(() => tableMonthKeys(transactions, settings.startDate, today), [transactions, settings.startDate, today]);
  const [selected, setSelected] = useState(monthKeyOf(today)); // month key or "all"
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [expanded, setExpanded] = useState(null);

  const startMonthKey = settings.startDate ? monthKeyOf(settings.startDate) : null;

  const blocks = useMemo(() => {
    const keys = selected === "all" ? monthKeys : [selected];
    return keys.map((monthKey) => {
      const isStartMonth = monthKey === startMonthKey;
      const opts = { targetPeriods, warningThreshold };
      if (isStartMonth) {
        if (settings.skippedBackfill) opts.startOverride = settings.startDate;
        else opts.backfillAmount = settings.backfillAmount || 0;
      }
      const { rows, totals } = getMonthDayRows(transactions, daySettingsMap, pauses, dailyTarget, monthKey, today, opts);
      return { monthKey, rows, totals };
    });
  }, [selected, monthKeys, transactions, daySettingsMap, pauses, targetPeriods, dailyTarget, warningThreshold, today, settings, startMonthKey]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  }

  function sorted(rows) {
    const mult = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sort.key === "spent" ? a.spent : a.date;
      const bv = sort.key === "spent" ? b.spent : b.date;
      if (av === bv) return a.date < b.date ? 1 : -1;
      return av < bv ? -1 * mult : 1 * mult;
    });
  }

  function SortHead({ k, label, first }) {
    const active = sort.key === k;
    const Arrow = sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <th style={{ ...th, ...(first ? { position: "sticky", left: 0, zIndex: 2, textAlign: "left" } : {}), cursor: "pointer", color: active ? COLORS.ink : th.color }} onClick={() => toggleSort(k)}>
        {label}
        {active && <Arrow size={10} style={{ marginLeft: 3, verticalAlign: "middle" }} />}
      </th>
    );
  }

  const signed = (n) => `${n < 0 ? "-" : "+"}${CURRENCY} ${fmt(Math.abs(n))}`;
  const hasRows = blocks.some((b) => b.rows.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={onBack} style={{ border: "none", background: "none", color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", padding: 0 }}>
          ← Back
        </button>
        <button
          onClick={() => exportDaysToExcel(blocks, transactions, selected)}
          disabled={!hasRows}
          style={{
            display: "flex", alignItems: "center", gap: 5, border: `1px solid ${COLORS.line}`, background: "transparent",
            color: hasRows ? COLORS.ink : "rgba(var(--uf-ink-rgb),0.3)", fontSize: 11.5, fontFamily: FONT_UI, borderRadius: 4,
            padding: "5px 9px", cursor: hasRows ? "pointer" : "default",
          }}
        >
          <Download size={12} />
          Excel
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: FONT_VOICE, fontSize: 18, color: COLORS.ink, flex: 1 }}>All days</div>
        <select
          value={selected}
          onChange={(e) => { setSelected(e.target.value); setExpanded(null); }}
          style={{ fontFamily: FONT_UI, fontSize: 12.5, padding: "6px 8px", borderRadius: 4, border: `1px solid ${COLORS.line}`, background: "#FBFBF8", color: COLORS.ink }}
        >
          <option value="all">All months</option>
          {monthKeys.map((k) => (
            <option key={k} value={k}>{monthLabelFor(k)}</option>
          ))}
        </select>
      </div>

      {!hasRows ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.5)", fontFamily: FONT_UI }}>
          No days to show for this month yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto", margin: "0 -22px", padding: "0 22px" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 450 }}>
            <thead>
              <tr>
                <SortHead k="date" label="Date" first />
                <th style={{ ...th, textAlign: "left" }}>Status</th>
                <SortHead k="spent" label="Spent" />
                <th style={th}>Target</th>
                <th style={th}>Added</th>
                <th style={th}>Saved / over</th>
              </tr>
            </thead>
            {blocks.map(({ monthKey, rows, totals }) => (
              <tbody key={monthKey}>
                {selected === "all" && (
                  <tr>
                    <td colSpan={6} style={{ ...td, textAlign: "left", fontFamily: FONT_VOICE, fontSize: 14, color: COLORS.ink, paddingTop: 14, background: COLORS.paper }}>
                      {monthLabelFor(monthKey)}
                    </td>
                  </tr>
                )}
                {sorted(rows).map((r) => {
                  const isOpen = expanded === r.date;
                  const dayTxns = transactions.filter((t) => t.date === r.date).sort((a, b) => b.createdAt - a.createdAt);
                  const state = r.included ? getDailyState(r.spent, r.target, r.warning) : "over";
                  return [
                    <tr key={r.date} onClick={() => setExpanded(isOpen ? null : r.date)} style={{ cursor: "pointer" }}>
                      <td style={{ ...td, ...stickyFirst, color: COLORS.ink, fontFamily: FONT_UI }}>{dateLabel(r.date)}</td>
                      <td style={{ ...td, textAlign: "left", fontFamily: FONT_UI, fontSize: 11.5, color: r.status === "included" ? COLORS.ink : "rgba(var(--uf-ink-rgb),0.45)", fontStyle: r.status === "paused" ? "italic" : "normal" }}>
                        {STATUS_LABEL[r.status]}
                      </td>
                      <td style={{ ...td, fontFamily: FONT_MONO, color: r.spent > 0 ? STATE_COLOR[state] : "rgba(var(--uf-ink-rgb),0.35)" }}>
                        {r.spent > 0 ? fmt(r.spent) : "—"}
                      </td>
                      <td style={{ ...td, fontFamily: FONT_MONO, color: r.holiday && r.target > 0 ? COLORS.gold : "rgba(var(--uf-ink-rgb),0.55)" }}>{r.target > 0 ? fmt(r.target) : "—"}</td>
                      <td style={{ ...td, fontFamily: FONT_MONO, color: r.added > 0 ? COLORS.teal : "rgba(var(--uf-ink-rgb),0.35)" }}>{r.added > 0 ? `+${fmt(r.added)}` : "—"}</td>
                      <td style={{ ...td, fontFamily: FONT_MONO, color: r.saved > 0 ? COLORS.teal : r.saved < 0 ? COLORS.brick : "rgba(var(--uf-ink-rgb),0.35)" }}>
                        {r.saved === 0 ? "—" : signed(r.saved)}
                      </td>
                    </tr>,
                    isOpen && (
                      <tr key={`${r.date}-open`}>
                        <td colSpan={6} style={{ padding: "2px 0 8px", borderBottom: `1px solid ${COLORS.lineSoft}` }}>
                          <TodayList transactions={dayTxns} onDelete={onDelete} emptyText="Nothing logged this day." />
                        </td>
                      </tr>
                    ),
                  ];
                })}
                {totals.backfill > 0 && (
                  <tr>
                    <td style={{ ...td, ...stickyFirst, fontFamily: FONT_UI, fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)" }}>Before app</td>
                    <td style={td} />
                    <td style={{ ...td, fontFamily: FONT_MONO, color: COLORS.brick }}>{fmt(totals.backfill)}</td>
                    <td style={td} />
                    <td style={td} />
                    <td style={{ ...td, fontFamily: FONT_MONO, color: COLORS.brick }}>{signed(-totals.backfill)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ ...td, ...stickyFirst, fontFamily: FONT_UI, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>Total</td>
                  <td style={{ ...td, textAlign: "left", fontFamily: FONT_UI, fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", borderTop: `1px solid ${COLORS.line}` }}>
                    {totals.eligibleDays} day{totals.eligibleDays === 1 ? "" : "s"}
                  </td>
                  <td style={{ ...td, fontFamily: FONT_MONO, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>{fmt(totals.spent + totals.backfill)}</td>
                  <td style={{ ...td, fontFamily: FONT_MONO, fontWeight: 600, color: COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>{fmt(totals.target)}</td>
                  <td style={{ ...td, fontFamily: FONT_MONO, fontWeight: 600, color: totals.added > 0 ? COLORS.teal : COLORS.ink, borderTop: `1px solid ${COLORS.line}` }}>{totals.added > 0 ? `+${fmt(totals.added)}` : "—"}</td>
                  <td style={{ ...td, fontFamily: FONT_MONO, fontWeight: 600, color: totals.saved >= 0 ? COLORS.teal : COLORS.brick, borderTop: `1px solid ${COLORS.line}` }}>{signed(totals.saved)}</td>
                </tr>
              </tbody>
            ))}
          </table>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: "rgba(var(--uf-ink-rgb),0.45)", fontFamily: FONT_UI, lineHeight: 1.5 }}>
        Tap a day to see or delete its entries. Spent counts expenses only; Added is extra money you put in. Gold targets are holiday targets. Excluded and paused days earn no target, so anything spent on them shows as over.
      </div>
    </div>
  );
}
