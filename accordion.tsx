import { TOTAL_SLOTS, type ParkingRecord, formatDurationHMS } from "@/lib/parking";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useState } from "react";
import { useNow } from "@/hooks/use-now";

interface Props {
  records: ParkingRecord[];
}

export function SlotGrid({ records }: Props) {
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const now = useNow(1000);

  const activeBySlot = new Map<number, ParkingRecord>();
  for (const r of records) {
    if (r.status === "active") activeBySlot.set(r.slot, r);
  }

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1);
  const openRecord = openSlot !== null ? activeBySlot.get(openSlot) : undefined;

  return (
    <>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {slots.map((n) => {
          const rec = activeBySlot.get(n);
          const occupied = !!rec;

          const trigger = (
            <button
              key={n}
              type="button"
              onClick={() => occupied && setOpenSlot(n)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                occupied
                  ? "border-destructive/40 bg-destructive/15 text-destructive cursor-pointer hover:bg-destructive/20"
                  : "border-success/30 bg-success/10 text-success animate-slot-pulse cursor-default",
              )}
              aria-label={`Slot ${n} ${occupied ? "occupied" : "free"}`}
            >
              {n}
            </button>
          );

          return (
            <HoverCard key={n} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
              <HoverCardContent
                side="top"
                align="center"
                className="w-64 rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-card backdrop-blur"
              >
                {occupied && rec ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Slot {n}
                      </span>
                      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase text-destructive">
                        Occupied
                      </span>
                    </div>
                    <dl className="grid grid-cols-3 gap-y-1.5">
                      <dt className="text-xs text-muted-foreground">ID</dt>
                      <dd className="col-span-2 truncate font-mono font-medium">
                        {rec.barcode}
                      </dd>
                      <dt className="text-xs text-muted-foreground">Vehicle</dt>
                      <dd className="col-span-2 truncate font-mono font-medium">
                        {rec.vehicleNumber || "—"}
                      </dd>
                      <dt className="text-xs text-muted-foreground">Type</dt>
                      <dd className="col-span-2 capitalize">{rec.userType}</dd>
                      <dt className="text-xs text-muted-foreground">Entry</dt>
                      <dd className="col-span-2">
                        {new Date(rec.entryTime).toLocaleTimeString()}
                      </dd>
                      <dt className="text-xs text-muted-foreground">Duration</dt>
                      <dd className="col-span-2 font-mono tabular-nums">
                        {formatDurationHMS(now - rec.entryTime)}
                      </dd>
                    </dl>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Slot {n}
                    </span>
                    <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-medium uppercase text-success">
                      Available
                    </span>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>

      <Dialog open={openSlot !== null} onOpenChange={(o) => !o && setOpenSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slot {openSlot}</DialogTitle>
            <DialogDescription>Currently occupied</DialogDescription>
          </DialogHeader>
          {openRecord && (
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="col-span-2 font-mono font-medium">{openRecord.barcode}</dd>
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="col-span-2 font-mono font-medium">
                {openRecord.vehicleNumber || "—"}
              </dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="col-span-2 capitalize">{openRecord.userType}</dd>
              <dt className="text-muted-foreground">Entry</dt>
              <dd className="col-span-2">
                {new Date(openRecord.entryTime).toLocaleString()}
              </dd>
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="col-span-2 font-mono tabular-nums">
                {formatDurationHMS(now - openRecord.entryTime)}
              </dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
