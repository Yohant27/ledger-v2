import { Download } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { monthKeyOf, todayStr } from "../logic.js";
import { exportTransactionsToExcel } from "../exportExcel.js";
import TodayList from "./TodayList.jsx";

export default function MonthTransactions({ transactions, onDelete, onBack }) {
  const monthKey = monthKeyOf(todayStr());
  const monthTxns = transactions
    .filter((t) => monthKeyOf(t.date) === monthKey)
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : b.date < a.date ? 1 : -1));

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const totalSpent = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <button onClick={onBack} style={{ border: "none", background: "none", color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, fontSize: 13, cursor: "pointer", padding: 0 }}>
          ← Back
        </button>
        <button
          onClick={() => exportTransactionsToExcel(monthTxns, monthKey)}
          disabled={monthTxns.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            border: `1px solid ${COLORS.line}`,
            background: "transparent",
            color: monthTxns.length === 0 ? "rgba(var(--uf-ink-rgb),0.3)" : COLORS.ink,
            fontSize: 11.5,
            fontFamily: FONT_UI,
            borderRadius: 4,
            padding: "5px 9px",
            cursor: monthTxns.length === 0 ? "default" : "pointer",
          }}
        >
          <Download size={12} />
          Excel
        </button>
      </div>

      <div style={{ fontFamily: FONT_VOICE, fontSize: 18, color: COLORS.ink, margin: "10px 0 2px" }}>
        {monthLabel}
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.55)", fontFamily: FONT_UI, marginBottom: 12 }}>
        {CURRENCY} {fmt(totalSpent)} spent · {monthTxns.length} transaction{monthTxns.length === 1 ? "" : "s"}
      </div>

      <div style={{ maxHeight: 420, overflowY: "auto" }}>
        <TodayList transactions={monthTxns} onDelete={onDelete} emptyText="No transactions this month yet." />
      </div>
    </div>
  );
}
