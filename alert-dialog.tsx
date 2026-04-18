import { Card } from "@/components/ui/card";
import { TOTAL_SLOTS, type ParkingRecord } from "@/lib/parking";
import { CircleParking, GraduationCap, Briefcase, TrendingUp } from "lucide-react";

interface Props {
  records: ParkingRecord[];
}

export function StatsBar({ records }: Props) {
  const active = records.filter((r) => r.status === "active");
  const occupied = active.length;
  const free = TOTAL_SLOTS - occupied;
  const pct = Math.round((occupied / TOTAL_SLOTS) * 100);
  const students = active.filter((r) => r.userType === "student").length;
  const faculty = active.filter((r) => r.userType === "faculty").length;

  const items = [
    {
      icon: CircleParking,
      label: "Occupancy",
      value: `${occupied}/${TOTAL_SLOTS}`,
      sub: `${pct}% full`,
      tint: "text-terracotta",
    },
    {
      icon: TrendingUp,
      label: "Free slots",
      value: String(free),
      sub: free === 0 ? "Full" : "Available",
      tint: "text-success",
    },
    {
      icon: GraduationCap,
      label: "Students",
      value: String(students),
      sub: "active",
      tint: "text-primary",
    },
    {
      icon: Briefcase,
      label: "Faculty",
      value: String(faculty),
      sub: "active",
      tint: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className="flex items-center gap-3 p-4 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <it.icon className={`h-5 w-5 ${it.tint}`} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {it.label}
            </div>
            <div className="text-lg font-semibold leading-tight">{it.value}</div>
            <div className="text-xs text-muted-foreground">{it.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
