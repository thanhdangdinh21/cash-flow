import {
  Book,
  Car,
  Coffee,
  Film,
  Gift,
  Heart,
  Home,
  PieChart,
  Receipt,
  ShoppingCart,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

// Design icon keys (stored on Category.icon) — mirrors apps/mobile/components/CategoryIcon.tsx,
// swapping Ionicons glyphs for the lucide-react equivalents.
const ICON_MAP: Record<string, { icon: LucideIcon; tint: string }> = {
  cart: { icon: ShoppingCart, tint: "#1A7A50" },
  coffee: { icon: Coffee, tint: "#BE4A30" },
  home2: { icon: Home, tint: "#2C5E8A" },
  car: { icon: Car, tint: "#B07A1E" },
  film: { icon: Film, tint: "#7A4FB0" },
  zap: { icon: Zap, tint: "#3A7A6E" },
  trendUp: { icon: TrendingUp, tint: "#1A7A50" },
  receipt: { icon: Receipt, tint: "#59574E" },
  wallet: { icon: Wallet, tint: "#59574E" },
  users: { icon: Users, tint: "#2C5E8A" },
  pie: { icon: PieChart, tint: "#7A4FB0" },
  gift: { icon: Gift, tint: "#BE4A30" },
  heart: { icon: Heart, tint: "#BE4A30" },
  book: { icon: Book, tint: "#2C5E8A" },
};

const FALLBACK = { icon: Tag, tint: "#59574E" };

export function categoryMeta(icon?: string | null): { icon: LucideIcon; tint: string } {
  return ICON_MAP[icon ?? ""] ?? FALLBACK;
}

export const CATEGORY_ICON_KEYS = Object.keys(ICON_MAP);
