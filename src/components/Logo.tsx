/**
 * NOIR brand mark: the fluid black "N" on a brushed-silver tile.
 * public/noir-logo-128.png for UI, noir-logo.png (512) for social/PWA,
 * src/app/favicon.ico + apple-touch-icon.png for browsers.
 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/noir-logo-128.png"
      alt="NOIR"
      className={`shrink-0 rounded-[22%] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_20px_-8px_rgba(199,205,255,0.45)] ${className}`}
    />
  );
}
