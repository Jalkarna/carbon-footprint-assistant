"use client";

import { useState } from "react";
import { History, Trash2 } from "lucide-react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { useHydrated } from "@/components/useHydrated";
import { PageHeader } from "@/components/app/PageHeader";
import { ActivityForm } from "@/components/app/ActivityForm";
import { ActivityList } from "@/components/app/ActivityList";
import { GoalSetter } from "@/components/app/GoalSetter";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  useToast,
} from "@/components/ui";
import { PageSkeleton } from "@/components/app/Skeletons";

export function LogClient() {
  const hydrated = useHydrated();
  const activities = useCarbonStore((s) => s.activities);
  const clearAll = useCarbonStore((s) => s.clearAll);
  const { toast } = useToast();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Log"
        title="Log an activity"
        description="Record the things you do — we convert them to CO2e using documented emission factors."
        actions={
          activities.length > 0 ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Clear all
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardBody>
              <ActivityForm />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <GoalSetter />
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex items-center gap-2">
          <History aria-hidden="true" className="size-4 text-fg-muted" />
          <div>
            <CardTitle as="h2">History</CardTitle>
            <CardDescription>
              {activities.length} logged{" "}
              {activities.length === 1 ? "activity" : "activities"}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardBody>
          <ActivityList />
        </CardBody>
      </Card>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all activities?"
        description="This permanently removes every logged activity and your goal from this browser. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmClear(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearAll();
              setConfirmClear(false);
              toast("All activities cleared.", "info");
            }}
          >
            Clear everything
          </Button>
        </div>
      </Dialog>
    </>
  );
}
