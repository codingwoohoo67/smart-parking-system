import { useCallback, useEffect, useState } from "react";
import {
  loadRecords,
  saveRecords,
  processScan,
  STORAGE_KEY,
  type ParkingRecord,
  type ScanResult,
} from "@/lib/parking";

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecords(loadRecords());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) saveRecords(records);
  }, [records, hydrated]);

  const scan = useCallback(
    (barcode: string, vehicleNumber: string = ""): ScanResult => {
      const { result, records: updated } = processScan(barcode, records, vehicleNumber);
      if (updated !== records) setRecords(updated);
      return result;
    },
    [records],
  );

  const reset = useCallback(() => setRecords([]), []);

  return { records, scan, reset, hydrated };
}
