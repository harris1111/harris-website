"use client";

/**
 * CRT/cyberpunk overlay for Matrix and Hacker themes.
 * Pure CSS — no JS animation. pointer-events: none so it doesn't block interaction.
 */
export function CrtOverlay({ variant = "matrix" }: { variant?: "matrix" | "hacker" }) {
  const isHacker = variant === "hacker";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    >
      {/* Scanlines — green for matrix, cyan for hacker */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isHacker ? 0.06 : 0.08,
          background: isHacker
            ? "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(5, 217, 232, 0.15) 1px, rgba(5, 217, 232, 0.15) 2px)"
            : "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
          animation: isHacker ? "hacker-scan 10s linear infinite" : undefined,
        }}
      />
      {/* Screen edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isHacker ? 0.5 : 0.4,
          background: isHacker
            ? "radial-gradient(ellipse at center, transparent 50%, rgba(13, 2, 8, 0.8) 100%)"
            : "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      {/* Hacker: animated glitch bar that sweeps down the screen */}
      {isHacker && (
        <div
          className="absolute left-0 right-0 h-[2px] opacity-30"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(5, 217, 232, 0.8), rgba(255, 42, 109, 0.6), transparent)",
            animation: "hacker-glitch-bar 6s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
