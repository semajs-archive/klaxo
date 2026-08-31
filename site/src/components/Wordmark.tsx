/**
 * The mark: a spine of objectives, each one sitting on the one below it —
 * the same idea the whole site is built around, at 20px.
 */
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <span aria-hidden="true" className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-ink text-white">
        <svg viewBox="0 0 20 20" fill="none" className="h-[13px] w-[13px]">
          <path d="M4 5h7M4 10h12M4 15h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[1.25rem] font-bold tracking-[-0.03em]">KLAXO</span>
    </span>
  );
}
