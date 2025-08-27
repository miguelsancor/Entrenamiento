// src/components/RestTimer.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type RestTimerProps = {
  value: number;
  show: boolean;
  label?: string;
  warnAt?: number;
  autoExpandAt?: number;
  corner?: "br" | "bl" | "tr" | "tl";
  max?: number;
  accent?: string; // verde spotify por defecto
};

export default function RestTimer({
  value,
  show,
  label = "Descanso",
  warnAt = 10,
  autoExpandAt = 10,
  corner = "br",
  max = 90,
  accent = "#1DB954",
}: RestTimerProps) {
  // --------- hooks (orden estable) ----------
  const [isClient, setIsClient] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient) return;
    try {
      setMinimized(localStorage.getItem("resttimer:minimized") === "1");
      setExpanded(localStorage.getItem("resttimer:expanded") === "1");
    } catch {}
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    try { localStorage.setItem("resttimer:minimized", minimized ? "1" : "0"); } catch {}
  }, [minimized, isClient]);

  useEffect(() => {
    if (!isClient) return;
    try { localStorage.setItem("resttimer:expanded", expanded ? "1" : "0"); } catch {}
  }, [expanded, isClient]);

  useEffect(() => {
    if (!show) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 150);
    return () => clearTimeout(t);
  }, [value, show]);

  useEffect(() => {
    if (!show) return;
    if (value > 0 && value <= autoExpandAt) setExpanded(true);
  }, [value, autoExpandAt, show]);

  if (!isClient || !show) return null;

  // --------- estilos dinámicos ----------
  const cornerClass =
    corner === "bl" ? "bottom-6 left-6" :
    corner === "tr" ? "top-6 right-6" :
    corner === "tl" ? "top-6 left-6" :
    "bottom-6 right-6";

  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const deg = pct * 360;

  // 🔥 siempre rojo para el número (glow)
  const numberStyle: React.CSSProperties = {
    color: "#ef4444",
    filter: "drop-shadow(0 0 1.15rem rgba(239,68,68,.85))",
    lineHeight: 1,
    fontWeight: 900,
    fontVariantNumeric: "tabular-nums",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  };

  // tamaños GRANDES (responsive)
  const badgeFontSize = "clamp(2.75rem, 5.5vw, 5.5rem)";
  const popupFontSize = "clamp(7rem, 13vw, 13rem)";

  // El anillo y el overlay se quedan con el acento (verde Spotify)
  const ringColor = accent;

  // ---------- Badge (esquina) ----------
  const showBadge = !expanded;
  const Badge = showBadge ? (
    <div className={`fixed ${cornerClass} z-[2147483000]`}>
      {minimized ? (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="select-none rounded-full px-3 py-2 bg-gray-950/90 text-white border border-white/10 shadow-2xl hover:scale-105 transition backdrop-blur"
          title="Mostrar temporizador"
        >
          <span className="mr-2 text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
          <span style={{ ...numberStyle, fontSize: "1.4rem" }}>
            {value}<span className="ml-0.5 align-super" style={{ fontSize: ".8rem" }}>s</span>
          </span>
        </button>
      ) : (
        <div className="relative rounded-2xl border border-white/10 bg-gray-950/90 text-white px-4 py-3 shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gray-900/90 border border-white/10 text-gray-300 text-sm leading-none grid place-items-center hover:scale-105"
            title="Minimizar"
          >
            —
          </button>

          <div className="text-[10px] uppercase tracking-widest text-gray-400">{label}</div>

          <div
            aria-live="polite"
            className={`select-none transition-transform duration-150 ${bump ? "scale-110" : "scale-100"}`}
            style={{ ...numberStyle, fontSize: badgeFontSize }}
          >
            {value}
            <span className="align-super ml-1" style={{ fontSize: "40%" }}>s</span>
          </div>

          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-200 underline decoration-dotted"
              title="Expandir (popup)"
            >
              Expandir
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  // ---------- Modal centrado con overlay verde ----------
  const Modal = expanded ? (
    <div
      className="fixed inset-0 z-[2147483647] flex items-center justify-center"
      style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        className="absolute inset-0"
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(3px)",
          background: `radial-gradient(60% 60% at 50% 50%, ${hexOrCssToRgba(accent, 0.30)} 0%, rgba(0,0,0,.75) 100%)`,
        }}
        onClick={() => setExpanded(false)}
      />
      <div className="relative w-[min(92vw,28rem)]">
        <button
          onClick={() => setExpanded(false)}
          className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-gray-950/95 border border-white/10 text-gray-200 text-lg leading-none grid place-items-center shadow-xl"
          title="Cerrar"
        >
          ✕
        </button>

        <div className="rounded-3xl border border-white/10 bg-gray-950/90 text-white shadow-2xl p-6 backdrop-blur">
          <div className="text-center text-xs uppercase tracking-widest text-gray-400 mb-4">
            {label}
          </div>

          {/* Anillo */}
          <div
            className="relative mx-auto w-64 h-64 md:w-80 md:h-80 rounded-full p-1 transition-all"
            style={{
              backgroundImage: `conic-gradient(${ringColor} ${deg}deg, rgba(255,255,255,0.08) 0deg)`,
              boxShadow: `0 0 50px ${hexOrCssToRgba(accent, 0.30)}`,
            }}
          >
            <div className="absolute inset-2 rounded-full bg-gray-950/90 border border-white/10 grid place-items-center">
              <div
                aria-live="polite"
                className={`select-none transition-transform duration-150 ${bump ? "scale-110" : "scale-100"}`}
                style={{ ...numberStyle, fontSize: popupFontSize }}
              >
                {value}
                <span className="align-super ml-1" style={{ fontSize: "35%" }}>s</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-[11px] text-gray-400">
            Se cerrará automáticamente al terminar.
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return createPortal(
    <>
      {Badge}
      {Modal}
    </>,
    document.body
  );
}

// util para el overlay verde
function hexOrCssToRgba(color: string, alpha = 1): string {
  if (/rgba?\(|hsla?\(/i.test(color)) return color;
  const hex = color.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
