export const TOTAL_SLOTS = 65;
export const STORAGE_KEY = "vit-parking-records-v2";

export type UserType = "student" | "faculty";
export type Status = "active" | "exited";

export interface ParkingRecord {
  id: string;
  barcode: string;
  vehicleNumber: string;
  userType: UserType;
  slot: number;
  entryTime: number;
  exitTime: number | null;
  status: Status;
}

const STUDENT_RE = /^\d{2}[A-Z]{3}\d{4}$/;

export function detectUserType(raw: string): UserType | null {
  const code = raw.trim().toUpperCase();
  if (!code) return null;
  if (STUDENT_RE.test(code)) return "student";
  if (/^\d{3,8}$/.test(code)) return "faculty";
  return null;
}

/** Normalise a vehicle plate: uppercase, strip non-alphanumerics. */
export function normalizeVehicle(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Loose validation: allow 4-12 alphanumeric chars after normalisation. */
export function isValidVehicle(raw: string): boolean {
  const v = normalizeVehicle(raw);
  return v.length >= 4 && v.length <= 12;
}

export function loadRecords(): ParkingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ParkingRecord[];
    // Backfill vehicleNumber for any legacy records
    return parsed.map((r) => ({ ...r, vehicleNumber: r.vehicleNumber ?? "" }));
  } catch {
    return [];
  }
}

export function saveRecords(records: ParkingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function nextFreeSlot(records: ParkingRecord[]): number | null {
  const taken = new Set(
    records.filter((r) => r.status === "active").map((r) => r.slot),
  );
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}

/** Short duration like "1h 12m" — used in summary lists. */
export function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Live duration with seconds: "Xh Ym Zs". */
export function formatDurationHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export interface ScanResult {
  type: "entry" | "exit" | "full" | "invalid" | "duplicate";
  message: string;
  record?: ParkingRecord;
}

/**
 * Process an ID scan. For entries, a vehicle number is required.
 * For exits, vehicleNumber is ignored (matched by ID only).
 */
export function processScan(
  barcode: string,
  records: ParkingRecord[],
  vehicleNumber: string = "",
): { result: ScanResult; records: ParkingRecord[] } {
  const code = barcode.trim().toUpperCase();
  const userType = detectUserType(code);
  if (!userType) {
    return {
      result: {
        type: "invalid",
        message: `Invalid ID format: "${barcode}". Expected student (e.g. 25BCE2668) or faculty employee number.`,
      },
      records,
    };
  }

  // Exit: same ID already inside → free its slot
  const active = records.find((r) => r.barcode === code && r.status === "active");
  if (active) {
    const exitTime = Date.now();
    const updated = records.map((r) =>
      r.id === active.id ? { ...r, exitTime, status: "exited" as const } : r,
    );
    return {
      result: {
        type: "exit",
        message: `Exit recorded · ${code} · ${active.vehicleNumber || "—"} · Slot ${active.slot} freed`,
        record: { ...active, exitTime, status: "exited" },
      },
      records: updated,
    };
  }

  // From here: ENTRY flow → vehicle number is required
  const vehicle = normalizeVehicle(vehicleNumber);
  if (!isValidVehicle(vehicle)) {
    return {
      result: {
        type: "invalid",
        message: "Vehicle number is required (e.g. KA-01-AB-1234).",
      },
      records,
    };
  }

  // Duplicate check: same vehicle plate already inside?
  const vehicleInside = records.find(
    (r) => r.status === "active" && r.vehicleNumber === vehicle,
  );
  if (vehicleInside) {
    return {
      result: {
        type: "duplicate",
        message: `Vehicle already inside · ${vehicle} · Slot ${vehicleInside.slot}`,
      },
      records,
    };
  }

  const slot = nextFreeSlot(records);
  if (slot === null) {
    return {
      result: { type: "full", message: "Parking is full. No slots available." },
      records,
    };
  }

  const newRecord: ParkingRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    barcode: code,
    vehicleNumber: vehicle,
    userType,
    slot,
    entryTime: Date.now(),
    exitTime: null,
    status: "active",
  };

  return {
    result: {
      type: "entry",
      message: `Entry recorded · ${code} · ${vehicle} → Slot ${slot}`,
      record: newRecord,
    },
    records: [newRecord, ...records],
  };
}
