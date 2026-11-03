import { Trash2, Wallet } from "lucide-react";
import { COLORS, FONT_MONO, FONT_UI, fmt } from "../theme.js";
import { CURRENCY } from "../config.js";
import { categoryLabel } from "../categories.jsx";

export default function TodayList({ transactions, onDelete, emptyText = "Nothing logged today yet." }) {
  if (transactions.length === 0) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <Wallet size={20} color="rgba(var(--uf-ink-rgb),0.3)" style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 12.5, color: "rgba(var(--uf-ink-rgb),0.5)", fontFamily: FONT_UI }}>
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div>
      {transactions.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 0",
            borderBottom: `1px solid ${COLORS.lineSoft}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: COLORS.ink, fontFamily: FONT_UI }}>
              {t.note || categoryLabel(t.category, t.type)}
            </div>
            {t.note && (
              <div style={{ fontSize: 10.5, color: "rgba(var(--uf-ink-rgb),0.45)", fontFamily: FONT_UI }}>
                {categoryLabel(t.category, t.type)}
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: t.type === "income" ? COLORS.teal : COLORS.brick,
              whiteSpace: "nowrap",
            }}
          >
            {t.type === "income" ? "+" : "-"}{CURRENCY} {fmt(t.amount)}
          </div>
          <button
            onClick={() => onDelete(t.id)}
            aria-label="Delete entry"
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              opacity: 0.55,
            }}
          >
            <Trash2 size={16} color="rgba(var(--uf-ink-rgb),0.5)" />
          </button>
        </div>
      ))}
    </div>
  );
}
