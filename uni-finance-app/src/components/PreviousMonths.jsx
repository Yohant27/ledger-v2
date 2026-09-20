import { useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { getMonthSummary, allMonthKeysDescending, monthKeyOf, todayStr } from "../logic.js";
import { exportTransactionsToExcel } from "../exportExcel.js";
import { categoryLabel } from "../categories.jsx";
import TodayList from "./TodayList.jsx";

function monthLabelFor(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function PreviousMonths({ transactions, onDelete, onBack }) {
  const [expanded, setExpanded] = useState(null);
  const currentMonthKey = monthKeyOf(todayStr());
  const monthKeys = allMonthKeysDescending(transactions).filter((k) => k !== currentMonthKey);

  return (
    <div>
      <button onClick={onBack} style={{ border: "none", background: "none", color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 10 }}>
        ← Back
      </button>

      {monthKeys.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.5)", fontFamily: FONT_UI }}>
          No previous months yet — this will fill in once a new month starts.
        </div>
      ) : (
        monthKeys.map((monthKey) => {
          const summary = getMonthSummary(transactions, monthKey);
          const isOpen = expanded === monthKey;
          return (
            <div key={monthKey} style={{ borderBottom: `1px solid ${COLORS.lineSoft}`, paddingBottom: 8, marginBottom: 8 }}>
              <button
                onClick={() => setExpanded(isOpen ? null : monthKey)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ flex: 1, fontFamily: FONT_VOICE, fontSize: 14.5, color: COLORS.ink }}>
                  {monthLabelFor(monthKey)}
                </span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.brick }}>
                  {CURRENCY} {fmt(summary.totalSpent)}
                </span>
                {isOpen ? <ChevronUp size={14} color="rgba(var(--uf-ink-rgb),0.4)" /> : <ChevronDown size={14} color="rgba(var(--uf-ink-rgb),0.4)" />}
              </button>

              {isOpen && (
                <div>
                  <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 8 }}>
                    <span>Income: {CURRENCY} {fmt(summary.totalIncome)}</span>
                    <span>Net: {CURRENCY} {fmt(summary.net)}</span>
                    {summary.topCategory && (
                      <span>Top: {categoryLabel(summary.topCategory, "expense")}</span>
                    )}
                  </div>
                  <button
                    onClick={() => exportTransactionsToExcel(summary.transactions, monthKey)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      border: `1px solid ${COLORS.line}`,
                      background: "transparent",
                      color: COLORS.ink,
                      fontSize: 11.5,
                      fontFamily: FONT_UI,
                      borderRadius: 4,
                      padding: "5px 9px",
                      cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    <Download size={12} />
                    Export {monthLabelFor(monthKey)}
                  </button>
                  <TodayList transactions={summary.transactions} onDelete={onDelete} emptyText="No transactions." />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
