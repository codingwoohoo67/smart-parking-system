import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ParkingRecord, formatDuration } from "@/lib/parking";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";

interface Props {
  records: ParkingRecord[];
}

export function HistoryList({ records }: Props) {
  const recent = [...records]
    .sort((a, b) => {
      const aT = Math.max(a.entryTime, a.exitTime ?? 0);
      const bT = Math.max(b.entryTime, b.exitTime ?? 0);
      return bT - aT;
    })
    .slice(0, 30);

  return (
    <Card className="p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-5 w-5 text-accent" />
        <h2 className="text-base font-semibold">Recent activity</h2>
      </div>
      {recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No scans yet. Start the scanner or enter an ID manually.
        </p>
      ) : (
        <ScrollArea className="h-[320px] pr-3">
          <ul className="space-y-2">
            {recent.map((r) => {
              const exited = r.status === "exited";
              const time = exited ? r.exitTime! : r.entryTime;
              return (
                <li
                  key={r.id + (exited ? "-exit" : "-entry")}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        exited ? "bg-success/15 text-success" : "bg-terracotta/15 text-terracotta"
                      }`}
                    >
                      {exited ? (
                        <ArrowUpFromLine className="h-4 w-4" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium truncate">
                        {r.barcode}
                        {r.vehicleNumber && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {r.vehicleNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(time).toLocaleTimeString()} · Slot {r.slot}
                        {exited && ` · ${formatDuration(r.exitTime! - r.entryTime)}`}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      exited
                        ? "border-success/40 text-success"
                        : "border-terracotta/40 text-terracotta"
                    }
                  >
                    {exited ? "Exit" : "Entry"}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </Card>
  );
}
