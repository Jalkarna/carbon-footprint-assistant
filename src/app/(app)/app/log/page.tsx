import type { Metadata } from "next";
import { LogClient } from "@/components/app/LogClient";

export const metadata: Metadata = {
  title: "Log activity",
};

export default function LogPage() {
  return <LogClient />;
}
