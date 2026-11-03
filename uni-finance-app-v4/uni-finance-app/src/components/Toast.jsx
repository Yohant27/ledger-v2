import { useEffect } from "react";
import { Check, AlertTriangle, Undo2 } from "lucide-react";
import { COLORS, FONT_UI } from "../theme.js";

const VARIANT_COLOR = {
  normal: COLORS.teal,
  warning: COLORS.gold,
  over: COLORS.brick,
};

// toast: { id, message, variant: 'normal' | 'warning' | 'over', onUndo?: () => void }
// Slides in from the TOP of the screen (below the phone's status bar / notch).
export default function Toast({ toast, onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, toast.onUndo ? duration + 1500 : duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  if (!toast) return null;
  const color = VARIANT_COLOR[toast.variant] || VARIANT_COLOR.normal;
  const Icon = toast.variant === "normal" ? Check : AlertTriangle;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 14,
        right: 14,
        top: "calc(env(safe-area-inset-top, 0px) + 10px)",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 12px",
          background: COLORS.paper,
          borderRadius: 6,
          borderLeft: `4px solid ${color}`,
          boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
          pointerEvents: "auto",
          animation: "uf-toast-in 200ms ease-out",
        }}
      >
        <Icon size={16} color={color} style={{ flex: "none" }} />
        <span style={{ flex: 1, fontSize: 13, color: COLORS.ink, fontFamily: FONT_UI, lineHeight: 1.35 }}>
          {toast.message}
        </span>
        {toast.onUndo && (
          <button
            onClick={() => {
              toast.onUndo();
              onDismiss();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              border: `1px solid ${COLORS.line}`,
              background: "transparent",
              color: COLORS.ink,
              fontFamily: FONT_UI,
              fontSize: 12,
              borderRadius: 4,
              padding: "5px 9px",
              cursor: "pointer",
              flex: "none",
            }}
          >
            <Undo2 size={12} />
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
