interface ModalShellProps {
  children: React.ReactNode;
  /** z-index class, defaults to "z-50" */
  zClass?: string;
  /** space-y gap class, defaults to "space-y-4" */
  spaceY?: string;
  /** Add text-center to inner card, defaults to false */
  centered?: boolean;
  /** Callback when clicking the overlay (outside the card) */
  onClickOutside?: () => void;
  /** Extra className on the inner card */
  cardClassName?: string;
}

export function ModalShell({
  children,
  zClass = "z-50",
  spaceY = "space-y-4",
  centered = false,
  onClickOutside,
  cardClassName = "",
}: ModalShellProps) {
  return (
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center p-5`}
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
      onClick={onClickOutside ? (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClickOutside(); } : undefined}
    >
      <div
        className={`w-full max-w-sm rounded-card p-6 ${spaceY} ${centered ? "text-center" : ""} ${cardClassName}`.trim()}
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
