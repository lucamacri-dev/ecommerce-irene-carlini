import { COLOR_HEX, type ColorName } from "@/data/products";

/**
 * Placeholder until real product photos are added (drop files in /public/products and
 * set `image` on the product). Shows a tinted tile that follows the selected color.
 */
export function ProductImage({
  name,
  type,
  color,
  className = "",
}: {
  name: string;
  type: string;
  color: ColorName;
  className?: string;
}) {
  const hex = COLOR_HEX[color];
  return (
    <div
      className={`relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-lg bg-muted ${className}`}
      role="img"
      aria-label={`${name} ${type} ${color}`}
    >
      <div
        className="absolute inset-0 opacity-90 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${hex}55, transparent 60%), linear-gradient(160deg, ${hex}33, ${hex}99)`,
        }}
      />
      <svg viewBox="0 0 200 160" className="absolute inset-x-8 top-1/4 text-white/90" aria-hidden>
        <path
          d="M10 110 C40 108 70 90 95 60 C105 48 120 50 125 62 C132 80 150 98 190 104 L190 118 C150 122 60 124 10 122 Z"
          fill={hex}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="2"
        />
        <rect
          x="150"
          y="104"
          width="6"
          height="40"
          fill={hex}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="2"
        />
      </svg>
      <div className="relative w-full p-4 text-white">
        <p className="text-xs uppercase tracking-[0.18em] opacity-80">{type}</p>
        <p className="text-2xl font-semibold tracking-wide">{name}</p>
      </div>
    </div>
  );
}
