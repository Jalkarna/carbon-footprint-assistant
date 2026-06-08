import {
  LayoutDashboard,
  PlusCircle,
  Lightbulb,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

/** Primary in-app navigation, shown in the sidebar and mobile nav. */
export const APP_NAV: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Your footprint at a glance",
  },
  {
    href: "/app/log",
    label: "Log activity",
    icon: PlusCircle,
    description: "Record trips, meals, energy, and purchases",
  },
  {
    href: "/app/insights",
    label: "Insights",
    icon: Lightbulb,
    description: "Personalized, quantified recommendations",
  },
  {
    href: "/app/assistant",
    label: "Assistant",
    icon: MessageSquare,
    description: "Ask questions about your footprint",
  },
];

/** Secondary links shown in headers/footers. */
export const INFO_NAV = [
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];
