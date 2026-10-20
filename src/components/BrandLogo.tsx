/** Official brand marks for the profile sources and launch chains. */
export type Brand = "solana" | "pumpfun" | "fomo" | "robinhood";

const BRANDS: Record<Brand, { src: string; alt: string }> = {
  solana: { src: "/brands/solana.jpg", alt: "Solana" },
  pumpfun: { src: "/brands/pumpfun.jpg", alt: "Pump.fun" },
  fomo: { src: "/brands/fomo.jpg", alt: "fomo.family" },
  robinhood: { src: "/brands/robinhood.png", alt: "Robinhood Chain" },
};

export function BrandLogo({ brand, className = "h-5 w-5" }: { brand: Brand; className?: string }) {
  const b = BRANDS[brand];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={b.src} alt={b.alt} title={b.alt} className={`inline-block shrink-0 rounded-md object-cover ${className}`} />;
}
