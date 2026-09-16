export type ThemeKey = "rosa" | "azul" | "oro" | "lavanda" | "esmeralda" | "vino";

export interface ThemeConfig {
  key: ThemeKey;
  name: string;
  description: string;
  primaryHex: string;
  secondaryHex: string;
  bgGradient: string;
  btnGradient: string;
  btnSolid: string;
  btnHover: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  textAccent: string;
  cardBorder: string;
  cardHoverRing: string;
  accentIconColor: string;
  accentHeartFill: string;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  rosa: {
    key: "rosa",
    name: "Rosa Romántico",
    description: "Tonos fresa y pétalo de rosa para suspirar",
    primaryHex: "#F43F5E",
    secondaryHex: "#FFE4E6",
    bgGradient: "from-rose-50/70 via-pink-50/40 to-paper",
    btnGradient: "from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700",
    btnSolid: "bg-rose-600 hover:bg-rose-700 text-white",
    btnHover: "hover:bg-rose-700",
    badgeBg: "bg-rose-50",
    badgeBorder: "border-rose-200",
    badgeText: "text-rose-700",
    textAccent: "text-rose-600",
    cardBorder: "border-rose-200/80",
    cardHoverRing: "hover:ring-rose-300/40",
    accentIconColor: "text-rose-500",
    accentHeartFill: "fill-rose-500 text-rose-500",
  },
  azul: {
    key: "azul",
    name: "Azul Cielo",
    description: "Cielo despejado y brisa suave de atardecer",
    primaryHex: "#0284C7",
    secondaryHex: "#E0F2FE",
    bgGradient: "from-sky-50/70 via-cyan-50/40 to-paper",
    btnGradient: "from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700",
    btnSolid: "bg-sky-600 hover:bg-sky-700 text-white",
    btnHover: "hover:bg-sky-700",
    badgeBg: "bg-sky-50",
    badgeBorder: "border-sky-200",
    badgeText: "text-sky-800",
    textAccent: "text-sky-600",
    cardBorder: "border-sky-200/80",
    cardHoverRing: "hover:ring-sky-300/40",
    accentIconColor: "text-sky-500",
    accentHeartFill: "fill-sky-500 text-sky-500",
  },
  oro: {
    key: "oro",
    name: "Oro & Miel",
    description: "Calidez de luz dorada y veladas acogedoras",
    primaryHex: "#D97706",
    secondaryHex: "#FEF3C7",
    bgGradient: "from-amber-50/70 via-yellow-50/40 to-paper",
    btnGradient: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
    btnSolid: "bg-amber-600 hover:bg-amber-700 text-white",
    btnHover: "hover:bg-amber-700",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
    badgeText: "text-amber-800",
    textAccent: "text-amber-600",
    cardBorder: "border-amber-200/80",
    cardHoverRing: "hover:ring-amber-300/40",
    accentIconColor: "text-amber-500",
    accentHeartFill: "fill-amber-500 text-amber-500",
  },
  lavanda: {
    key: "lavanda",
    name: "Lavanda Ensueño",
    description: "Místico, tierno y elegante como una flor silvestre",
    primaryHex: "#9333EA",
    secondaryHex: "#F3E8FF",
    bgGradient: "from-purple-50/70 via-fuchsia-50/40 to-paper",
    btnGradient: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
    btnSolid: "bg-purple-600 hover:bg-purple-700 text-white",
    btnHover: "hover:bg-purple-700",
    badgeBg: "bg-purple-50",
    badgeBorder: "border-purple-200",
    badgeText: "text-purple-800",
    textAccent: "text-purple-600",
    cardBorder: "border-purple-200/80",
    cardHoverRing: "hover:ring-purple-300/40",
    accentIconColor: "text-purple-500",
    accentHeartFill: "fill-purple-500 text-purple-500",
  },
  esmeralda: {
    key: "esmeralda",
    name: "Esmeralda Jardín",
    description: "Frescura natural, calma y paseos al aire libre",
    primaryHex: "#059669",
    secondaryHex: "#D1FAE5",
    bgGradient: "from-emerald-50/70 via-teal-50/40 to-paper",
    btnGradient: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    btnSolid: "bg-emerald-600 hover:bg-emerald-700 text-white",
    btnHover: "hover:bg-emerald-700",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
    badgeText: "text-emerald-800",
    textAccent: "text-emerald-600",
    cardBorder: "border-emerald-200/80",
    cardHoverRing: "hover:ring-emerald-300/40",
    accentIconColor: "text-emerald-500",
    accentHeartFill: "fill-emerald-500 text-emerald-500",
  },
  vino: {
    key: "vino",
    name: "Vino Borgoña",
    description: "Pasión profunda, copas de vino y noches íntimas",
    primaryHex: "#9F1239",
    secondaryHex: "#FFE4E6",
    bgGradient: "from-rose-100/60 via-stone-50/50 to-paper",
    btnGradient: "from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950",
    btnSolid: "bg-rose-800 hover:bg-rose-900 text-white",
    btnHover: "hover:bg-rose-900",
    badgeBg: "bg-rose-100/70",
    badgeBorder: "border-rose-300",
    badgeText: "text-rose-900",
    textAccent: "text-rose-800",
    cardBorder: "border-rose-300/80",
    cardHoverRing: "hover:ring-rose-400/40",
    accentIconColor: "text-rose-700",
    accentHeartFill: "fill-rose-700 text-rose-700",
  },
};

export function getTheme(themeKey?: string | null, defaultTheme: ThemeKey = "rosa"): ThemeConfig {
  if (themeKey && themeKey in THEMES) {
    return THEMES[themeKey as ThemeKey];
  }
  return THEMES[defaultTheme];
}
