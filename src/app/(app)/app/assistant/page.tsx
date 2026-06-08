import type { Metadata } from "next";
import { AssistantChat } from "@/components/app/AssistantChat";

export const metadata: Metadata = {
  title: "Assistant",
};

export default function AssistantPage() {
  // Fill the main content area; the chat manages its own internal scroll.
  return (
    <div className="-mx-4 -mt-4 flex h-[calc(100vh-3.5rem)] flex-col md:-mx-8 md:-mt-8 md:h-[calc(100vh-4rem)]">
      <div className="border-b border-[var(--border)] px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-fg">
          Assistant
        </h1>
      </div>
      <div className="min-h-0 flex-1">
        <AssistantChat />
      </div>
    </div>
  );
}
