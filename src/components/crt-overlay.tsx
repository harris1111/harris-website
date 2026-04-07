"use client";

/**
 * CRT scanline + glow overlay for Matrix theme.
 * Pure CSS — no JS animation. pointer-events: none so it doesn't block interaction.
 */
export function CrtOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)",
        }}
      />
      {/* Screen edge vignette */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
