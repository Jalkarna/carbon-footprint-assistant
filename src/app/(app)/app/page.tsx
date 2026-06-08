import type { Metadata } from "next";
import { DashboardClient } from "@/components/app/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
