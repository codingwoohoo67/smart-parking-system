import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Keyboard, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  onScan: (code: string, vehicleNumber: string) => void;
}

type CameraState =
  | "idle"
  | "requesting"
  | "scanning"
  | "success"
  | "error"
  | "unsupported";

export function Scanner({ onScan }: Props) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [lastDecoded, setLastDecoded] = useState<string>("");
  const [manualCode, setManualCode] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const vehicleRef = useRef<string>("");
  // Keep ref in sync so the async scan callback uses the latest value
  useEffect(() => {
    vehicleRef.current = vehicleNumber;
  }, [vehicleNumber]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // ZXing IScannerControls instance (kept loose to avoid hard import at module level)
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastScanRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });
  const mountedRef = useRef(true);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      stopCameraInternal();
    };
  }, []);

  function stopCameraInternal() {
    try {
      controlsRef.current?.stop();
    } catch {
      /* ignore */
    }
    controlsRef.current = null;

    const video = videoRef.current;
    if (video) {
      const stream = video.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      video.srcObject = null;
    }
  }

  async function startCamera() {
    setErrorMsg("");
    setLastDecoded("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      setErrorMsg("Camera API is not available in this browser. Use manual entry below.");
      return;
    }

    setCameraState("requesting");

    try {
      const [{ BrowserMultiFormatReader }, zxingLib] = await Promise.all([
        import("@zxing/browser"),
        import("@zxing/library"),
      ]);
      const { DecodeHintType, BarcodeFormat } = zxingLib;

      // Probe permission inside the user gesture
      try {
        const probeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        probeStream.getTracks().forEach((t) => t.stop());
      } catch (permErr) {
        const err = permErr as DOMException;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraState("error");
          setErrorMsg(
            "Camera permission denied. Enable it in your browser settings, or use manual entry below.",
          );
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setCameraState("error");
          setErrorMsg("No camera found on this device. Use manual entry below.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setCameraState("error");
          setErrorMsg("Camera is in use by another application. Close it and try again.");
        } else {
          setCameraState("error");
          setErrorMsg(
            `Could not access the camera (${err.name || "error"}). Use manual entry below.`,
          );
        }
        return;
      }

      if (!mountedRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 66, // ~15 fps
        delayBetweenScanSuccess: 400,
      });

      // Mark scanning before awaiting decoder so the <video> element renders
      setCameraState("scanning");
      // Yield a tick so React mounts the <video>
      await new Promise((r) => setTimeout(r, 0));

      if (!mountedRef.current || !videoRef.current) {
        return;
      }

      const controls = await reader.decodeFromVideoDevice(
        undefined, // let ZXing pick the default (back camera if available)
        videoRef.current,
        (result, _err, ctrls) => {
          if (!result) return;
          const text = result.getText();

          // Clean: uppercase, strip everything except A-Z 0-9
          const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");

          // Extract a valid student ID anywhere inside the cleaned string
          const STUDENT_ID_RE = /[0-9]{2}[A-Z]{3}[0-9]{4}/;
          const match = cleaned.match(STUDENT_ID_RE);

          if (!match) {
            // Noisy / partial decode — keep scanning continuously
            setErrorMsg("Scan unclear. Please try again or enter manually");
            return;
          }

          const extracted = match[0];
          const now = Date.now();
          if (
            extracted === lastScanRef.current.code &&
            now - lastScanRef.current.ts < 2500
          ) {
            return;
          }
          lastScanRef.current = { code: extracted, ts: now };

          if (!mountedRef.current) {
            ctrls.stop();
            return;
          }

          setErrorMsg("");
          setLastDecoded(extracted);
          setManualCode(extracted);
          setCameraState("success");
          onScan(extracted, vehicleRef.current);

          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => {
            ctrls.stop();
            stopCameraInternal();
            if (mountedRef.current) setCameraState("idle");
          }, 800);
        },
      );

      if (!mountedRef.current) {
        controls.stop();
        stopCameraInternal();
        return;
      }
      controlsRef.current = controls;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setCameraState("error");
      setErrorMsg(`Failed to start camera: ${msg}. Use manual entry below.`);
      stopCameraInternal();
    }
  }

  function stopCamera() {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    stopCameraInternal();
    if (mountedRef.current) setCameraState("idle");
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) {
      setErrorMsg("Please enter an ID.");
      return;
    }
    setErrorMsg("");
    setLastDecoded(code);
    onScan(code, vehicleNumber);
    setManualCode("");
    setVehicleNumber("");
  }

  const cameraActive = cameraState === "scanning" || cameraState === "success";
  const showFallback = true;

  return (
    <Card className="overflow-hidden p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-accent" />
          <h2 className="text-base font-semibold">Scanner</h2>
        </div>
        {cameraActive ? (
          <Button variant="outline" size="sm" onClick={stopCamera}>
            <CameraOff className="mr-2 h-4 w-4" /> Stop
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={startCamera}
            disabled={cameraState === "requesting"}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {cameraState === "requesting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" /> Start Scanner
              </>
            )}
          </Button>
        )}
      </div>

      {cameraState === "scanning" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-sm text-accent">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning… point the camera at a barcode or QR.
        </div>
      )}
      {cameraState === "success" && lastDecoded && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          <span className="truncate">
            Scan successful: <span className="font-mono font-medium">{lastDecoded}</span>
          </span>
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border bg-muted",
          cameraActive ? "aspect-square" : "h-0 border-0",
        )}
      >
        <video
          ref={videoRef}
          className="h-full w-full rounded-xl object-cover"
          muted
          playsInline
        />
        {cameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-2/3 w-2/3 rounded-xl border-2 border-accent/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
          </div>
        )}
      </div>

      {cameraState === "idle" && (
        <p className="mt-3 text-sm text-muted-foreground">
          Tap <span className="font-medium text-foreground">Start Scanner</span> to enable the camera, or type an ID below.
        </p>
      )}

      {(cameraState === "error" || cameraState === "unsupported" || cameraState === "scanning") && errorMsg && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {showFallback && (
        <form onSubmit={submitManual} className="mt-4 space-y-3">
          <label
            htmlFor="vehicleIdInput"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            Manual entry
          </label>
          <Input
            id="vehicleIdInput"
            placeholder="ID — e.g. 25BCE2668 or 100234"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoComplete="off"
            className="font-mono uppercase"
          />
          <Input
            id="vehiclePlateInput"
            placeholder="Vehicle Number — e.g. KA-01-AB-1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            autoComplete="off"
            className="font-mono uppercase"
            aria-label="Vehicle number"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-mono">YYAAA####</span> or numeric · Vehicle required for entry.
            </p>
            <Button type="submit" disabled={!manualCode.trim()}>
              Submit
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
