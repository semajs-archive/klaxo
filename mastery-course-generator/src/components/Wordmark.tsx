/**
 * The KLAXO mark: a spine of objectives, each sitting on the one below it —
 * the same glyph the public site uses, so the two surfaces read as one product.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-foreground text-background"
      >
        <svg viewBox="0 0 20 20" fill="none" className="h-[13px] w-[13px]">
          <path d="M4 5h7M4 10h12M4 15h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-[1.25rem] font-bold tracking-[-0.03em]">KLAXO</span>
    </span>
  );
}
