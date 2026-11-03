import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { COLORS, FONT_VOICE, FONT_UI } from "../theme.js";

const SLIDES = [
  {
    title: "Set a daily target",
    body:
      "You have a daily spending target (RM25 by default, editable anytime in Settings). It's a target, not a limit — the app never stops you from spending more, it just shows you where you stand.",
  },
  {
    title: "\u201cSaved so far\u201d",
    body:
      "Every day that counts toward your target adds its allowance to a running total. Whatever you don't spend on those days builds up as your Saved So Far — a live number for the whole month. Extra money you add (like a gift) goes straight onto it, and you can set a different target for a holiday.",
  },
  {
    title: "Not every day has to count",
    body:
      "Weekdays count toward your target by default, weekends don't — and you can flip any individual day in the Days tab. A day that doesn't count earns no allowance, but anything you spend on it still comes out of your savings.",
  },
  {
    title: "Pause for semester breaks",
    body:
      "On a break? Pause in Settings and those days stop counting entirely — no allowance, no days-left. Resume when classes start again. Spending during a pause is still recorded and still deducts from savings.",
  },
];

export default function Tutorial({ onFinish, finishLabel = "Got it" }) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div>
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= step ? COLORS.gold : COLORS.lineSoft,
            }}
          />
        ))}
      </div>

      <div style={{ minHeight: 150 }}>
        <div style={{ fontFamily: FONT_VOICE, fontSize: 19, color: COLORS.ink, marginBottom: 10 }}>
          {slide.title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(var(--uf-ink-rgb),0.75)", fontFamily: FONT_UI }}>
          {slide.body}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{
              padding: "10px 16px",
              borderRadius: 6,
              border: `1px solid ${COLORS.line}`,
              background: "transparent",
              color: "rgba(var(--uf-ink-rgb),0.6)",
              fontFamily: FONT_UI,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            background: COLORS.gold,
            color: "#2A1D0C",
            fontFamily: FONT_UI,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isLast ? finishLabel : "Next"}
          {!isLast && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  );
}
