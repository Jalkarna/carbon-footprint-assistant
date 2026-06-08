import type { Category } from "@/lib/emissions/types";
import type { LucideIcon } from "lucide-react";
import {
  Bus,
  Car,
  Bike,
  Plane,
  Train,
  Zap,
  Flame,
  Beef,
  Drumstick,
  Salad,
  Sprout,
  Shirt,
  Smartphone,
} from "lucide-react";

/** CSS colour token per category, mirrored from the design system. */
export const CATEGORY_COLOR_VAR: Record<Category, string> = {
  transport: "var(--cat-transport)",
  energy: "var(--cat-energy)",
  diet: "var(--cat-diet)",
  shopping: "var(--cat-shopping)",
};

/** Icon per category for headers and legends. */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  transport: Car,
  energy: Zap,
  diet: Salad,
  shopping: Shirt,
};

/** Icon per individual emission factor, used in lists and the log form. */
export const FACTOR_ICON: Record<string, LucideIcon> = {
  car_petrol: Car,
  car_electric: Car,
  bus: Bus,
  train: Train,
  flight_short: Plane,
  bike_walk: Bike,
  electricity: Zap,
  natural_gas: Flame,
  meal_beef: Beef,
  meal_poultry: Drumstick,
  meal_vegetarian: Salad,
  meal_vegan: Sprout,
  clothing_item: Shirt,
  electronics_spend: Smartphone,
};
