/**
 * NOIR brand mark: a white-to-steel rounded square with a knocked-out "N".
 * Inline SVG so it stays crisp at every size; public/noir-logo.svg is the
 * same artwork for favicons and social cards.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" className={`shrink-0 ${className}`} role="img" aria-label="NOIR">
      <defs>
        <linearGradient id="noir-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#8a8f98" />
        </linearGradient>
      </defs>
      <rect width="26" height="26" rx="7" fill="url(#noir-mark)" />
      <path d="M7.5 19V7h2.6l6.3 8V7H19v12h-2.6l-6.3-8v8z" fill="#08090a" />
    </svg>
  );
}
