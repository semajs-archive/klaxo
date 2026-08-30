/** The KLAXO wordmark: klaxon horn in a yellow tile, plus the name. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-on-brand"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 14V10c0-.6.4-1 1-1h3l6-5c.7-.5 1.5 0 1.5.8v14.4c0 .8-.8 1.3-1.5.8l-6-5H5c-.6 0-1-.4-1-1Z"
            fill="currentColor"
          />
          <path
            d="M18.5 9.5c.9 1.5.9 3.5 0 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-[21px] font-extrabold tracking-tight">klaxo</span>
    </span>
  );
}
