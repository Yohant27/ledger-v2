import { useState } from "react";
import { COLORS, FONT_VOICE, FONT_MONO, FONT_UI } from "../theme.js";
import { CURRENCY } from "../config.js";
import Tutorial from "./Tutorial.jsx";

export default function Onboarding({ onComplete }) {
  const [phase, setPhase] = useState("tutorial");
  const [amount, setAmount] = useState("");

  const monthName = new Date().toLocaleDateString("en-GB", { month: "long" });

  return (
    <div style={{ padding: "22px 22px" }}>
      {phase === "tutorial" ? (
        <Tutorial finishLabel="Continue" onFinish={() => setPhase("backfill")} />
      ) : (
        <div>
          <div style={{ fontFamily: FONT_VOICE, fontSize: 19, color: COLORS.ink, marginBottom: 10 }}>
            One last thing
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(var(--uf-ink-rgb),0.75)", fontFamily: FONT_UI, marginBottom: 16 }}>
            How much have you spent from the 1st of {monthName} up to today? This keeps your Saved So Far accurate for days before you started using the app.
          </div>

          <div style={{ position: "relative", marginBottom: 10 }}>
            <span
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                fontFamily: FONT_MONO,
                color: "rgba(var(--uf-ink-rgb),0.4)",
              }}
            >
              {CURRENCY}
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 12px 12px 44px",
                fontFamily: FONT_MONO,
                fontSize: 18,
                borderRadius: 6,
                border: `1px solid ${COLORS.line}`,
                background: "#FBFBF8",
                color: COLORS.ink,
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={() => {
              const val = parseFloat(amount);
              onComplete({ backfillAmount: !isNaN(val) && val > 0 ? val : 0, skipped: false });
            }}
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
              marginBottom: 8,
            }}
          >
            Confirm
          </button>
          <button
            onClick={() => onComplete({ backfillAmount: 0, skipped: true })}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 6,
              border: `1px solid ${COLORS.line}`,
              background: "transparent",
              color: "rgba(var(--uf-ink-rgb),0.55)",
              fontFamily: FONT_UI,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Skip — only count today onward
          </button>
        </div>
      )}
    </div>
  );
}
