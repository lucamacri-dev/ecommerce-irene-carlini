export type ColorName = "Black" | "Camel" | "Nude";

export const COLOR_HEX: Record<ColorName, string> = {
  Black: "#1A1A1A",
  Camel: "#B98B5A",
  Nude: "#E3C4A8",
};

export interface Product {
  slug: string;
  name: string;
  type: string;
  tagline: string;
  listPrice: number;
  salePrice: number;
  colors: ColorName[];
  sizes: number[];
  specs: { label: string; value: string }[];
  comfort: string[];
}

const SIZES = [36, 37, 38, 39, 40, 41];
const COLORS: ColorName[] = ["Black", "Camel", "Nude"];

export const PRODUCTS: Product[] = [
  {
    slug: "aurora-slingback",
    name: "Aurora",
    type: "Slingback",
    tagline: "Tacco a rocchetto e cinturino con cuscinetto a cuore.",
    listPrice: 349,
    salePrice: 279,
    colors: COLORS,
    sizes: SIZES,
    specs: [
      { label: "Tacco", value: "A rocchetto, 8,5 cm" },
      { label: "Punta", value: "Affusolata" },
      { label: "Tomaia", value: "Tessuto jeans in cotone" },
      { label: "Fodera", value: "Jersey elasticizzato" },
      { label: "Soletta", value: "Memory foam" },
      { label: "Suola esterna", value: "Gomma" },
    ],
    comfort: [
      "Sostegno dell'arco plantare",
      "Imbottitura extra sotto pianta e tallone",
      "Imbottitura sopra le dita",
      "Cuscinetto a cuore sul cinturino del tallone",
    ],
  },
  {
    slug: "marta-decollete",
    name: "Marta",
    type: "Décolleté",
    tagline: "Tacco a spillo e punta affusolata, comoda tutto il giorno.",
    listPrice: 339,
    salePrice: 269,
    colors: COLORS,
    sizes: SIZES,
    specs: [
      { label: "Tacco", value: "A spillo, 9,5 cm" },
      { label: "Punta", value: "Affusolata" },
      { label: "Tomaia", value: "Tessuto jeans in cotone" },
      { label: "Fodera", value: "Jersey elasticizzato" },
      { label: "Soletta", value: "Memory foam" },
      { label: "Suola esterna", value: "Gomma" },
    ],
    comfort: [
      "Sostegno dell'arco plantare",
      "Imbottitura extra sotto pianta e tallone",
      "Imbottitura sopra le dita e sulla punta",
      "Cuscinetto in memory foam sul retro del tallone",
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export const formatEur = (n: number) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
