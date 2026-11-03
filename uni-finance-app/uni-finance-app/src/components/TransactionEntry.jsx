import { useState, useRef } from "react";
import { Plus, Calendar } from "lucide-react";
import { COLORS, FONT_MONO, FONT_UI } from "../theme.js";
import { CURRENCY } from "../config.js";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../categories.jsx";
import { todayStr } from "../logic.js";

export default function TransactionEntry({ onAdd }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].key);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState("");
  const amountRef = useRef(null);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function switchType(t) {
    setType(t);
    setCategory((t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0].key);
  }

  function submit() {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setError("Enter an amount first");
      return;
    }
    onAdd({ type, amount: val, category, note: note.trim(), date });
    setAmount("");
    setNote("");
    setShowNote(false);
    setDate(todayStr());
    setShowDate(false);
    setError("");
    if (amountRef.current) amountRef.current.focus();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {["expense", "income"].map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 12.5,
              fontFamily: FONT_UI,
              borderRadius: 4,
              border: `1px solid ${type === t ? COLORS.ink : COLORS.line}`,
              background: type === t ? COLORS.ink : "transparent",
              color: type === t ? COLORS.paper : "rgba(var(--uf-ink-rgb),0.6)",
              cursor: "pointer",
            }}
          >
            {t === "expense" ? "Expense" : "Add money"}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 10 }}>
        <span
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 20,
            fontFamily: FONT_MONO,
            color: "rgba(var(--uf-ink-rgb),0.4)",
          }}
        >
          {CURRENCY}
        </span>
        <input
          ref={amountRef}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0.00"
          inputMode="decimal"
          autoFocus
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 14px 14px 52px",
            fontFamily: FONT_MONO,
            fontSize: 26,
            borderRadius: 6,
            border: `1px solid ${error ? COLORS.brick : COLORS.line}`,
            background: "#FBFBF8",
            color: COLORS.ink,
            outline: "none",
          }}
        />
      </div>
      {error && <div style={{ fontSize: 12, color: COLORS.brick, marginBottom: 8 }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {categories.map((c) => {
          const Icon = c.icon;
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 12px",
                fontSize: 12.5,
                fontFamily: FONT_UI,
                borderRadius: 8,
                border: `1px solid ${active ? COLORS.ink : COLORS.line}`,
                background: active ? COLORS.ink : "transparent",
                color: active ? COLORS.paper : "rgba(var(--uf-ink-rgb),0.65)",
                cursor: "pointer",
              }}
            >
              <Icon size={14} />
              {c.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, fontSize: 12 }}>
        <button
          onClick={() => setShowNote((s) => !s)}
          style={{
            border: "none",
            background: "none",
            color: "rgba(var(--uf-ink-rgb),0.5)",
            fontFamily: FONT_UI,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {showNote ? "− note" : "+ note"}
        </button>
        <button
          onClick={() => setShowDate((s) => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "none",
            background: "none",
            color: date === todayStr() ? "rgba(var(--uf-ink-rgb),0.5)" : COLORS.gold,
            fontFamily: FONT_UI,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Calendar size={12} />
          {date === todayStr() ? "Today" : date}
        </button>
      </div>

      {showNote && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="note (optional)"
          style={{
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
            marginBottom: 12,
          }}
        />
      )}

      {showDate && (
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          style={{
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
            marginBottom: 12,
          }}
        />
      )}

      <button
        onClick={submit}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 6,
          border: "none",
          background: COLORS.gold,
          color: "#2A1D0C",
          fontFamily: FONT_UI,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Plus size={16} strokeWidth={2.4} />
        {type === "income" ? "Add to savings" : "Submit"}
      </button>
    </div>
  );
}
