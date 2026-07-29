"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdCameraswitch, MdFlashlightOn, MdVideocamOff } from "react-icons/md";

/**
 * Camera QR reader for door check-in.
 *
 * Decoding prefers the browser's native BarcodeDetector (Chrome/Edge/Android,
 * hardware accelerated) and falls back to jsQR over canvas frames everywhere
 * else, notably iOS Safari. jsQR is imported lazily so the ~10 KB decoder only
 * loads when a camera is actually opened.
 */

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts?: {
  formats?: string[];
}) => BarcodeDetectorLike;

/** Torch is not in the standard MediaTrackConstraintSet typing yet. */
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

interface QrScannerProps {
  onDecode: (value: string) => void;
  /** Stops decoding without tearing the camera down — use while submitting. */
  paused?: boolean;
  /** The same payload is ignored for this long, so one badge is not read
   *  dozens of times a second. */
  cooldownMs?: number;
  className?: string;
}

const FRAME_INTERVAL_MS = 120; // ~8 decodes a second is plenty at a door.

export default function QrScanner({
  onDecode,
  paused = false,
  cooldownMs = 2500,
  className = "",
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastHitRef = useRef<{ value: string; at: number }>({
    value: "",
    at: 0,
  });
  // Read inside the animation loop, which is created once per stream.
  const pausedRef = useRef(paused);
  const onDecodeRef = useRef(onDecode);
  pausedRef.current = paused;
  onDecodeRef.current = onDecode;

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchable, setTorchable] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
    setTorchOn(false);
    setTorchable(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setError(null);
      // getUserMedia only exists on HTTPS and localhost.
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "This browser cannot open a camera here. Check-in over http:// only works on localhost — use the https:// address, or type the ticket number instead.",
        );
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }

        const track = stream.getVideoTracks()[0];
        setTorchable(
          !!(
            track?.getCapabilities?.() as MediaTrackCapabilities & {
              torch?: boolean;
            }
          )?.torch,
        );

        const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
          .BarcodeDetector;
        detectorRef.current = Ctor
          ? new Ctor({ formats: ["qr_code"] })
          : null;
        const jsQR = detectorRef.current
          ? null
          : (await import("jsqr")).default;

        setReady(true);

        let lastFrame = 0;
        const tick = async (now: number) => {
          rafRef.current = requestAnimationFrame(tick);
          if (pausedRef.current || now - lastFrame < FRAME_INTERVAL_MS) return;
          lastFrame = now;

          const v = videoRef.current;
          if (!v || v.readyState < 2 || !v.videoWidth) return;

          let value: string | null = null;
          try {
            if (detectorRef.current) {
              const hits = await detectorRef.current.detect(v);
              value = hits[0]?.rawValue ?? null;
            } else if (jsQR) {
              const canvas = canvasRef.current;
              const ctx = canvas?.getContext("2d", { willReadFrequently: true });
              if (!canvas || !ctx) return;
              // Decode at a capped width — full sensor frames cost far more
              // CPU without helping the read.
              const scale = Math.min(1, 640 / v.videoWidth);
              canvas.width = Math.round(v.videoWidth * scale);
              canvas.height = Math.round(v.videoHeight * scale);
              ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              value =
                jsQR(img.data, img.width, img.height, {
                  inversionAttempts: "dontInvert",
                })?.data ?? null;
            }
          } catch {
            // A single failed frame is not worth surfacing; the next one runs.
            return;
          }

          if (!value) return;
          const { value: lastValue, at } = lastHitRef.current;
          if (value === lastValue && now - at < cooldownMs) return;
          lastHitRef.current = { value, at: now };
          onDecodeRef.current(value);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera permission was declined. Allow camera access for this site, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Could not start the camera. Close any other app using it and try again.",
        );
      }
    };

    start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, cooldownMs, stop]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    await track
      .applyConstraints({ advanced: [{ torch: next } as TorchConstraint] })
      .then(() => setTorchOn(next))
      .catch(() => setTorchable(false));
  };

  if (error) {
    return (
      <div
        className={`rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2 ${className}`}
      >
        <MdVideocamOff className="w-5 h-5 shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-900 aspect-[4/3] ${className}`}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Aiming frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-3/5 aspect-square rounded-2xl border-2 transition-colors ${
            paused ? "border-emerald-400" : "border-white/70"
          }`}
        />
      </div>

      <div className="absolute top-2 left-2 text-[11px] font-medium text-white/90 bg-black/40 rounded-full px-2 py-0.5">
        {!ready ? "Starting camera…" : paused ? "Paused" : "Point at the QR code"}
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1.5">
        {torchable && (
          <button
            type="button"
            onClick={toggleTorch}
            title="Toggle torch"
            className={`p-2 rounded-full backdrop-blur ${
              torchOn ? "bg-white text-slate-900" : "bg-black/40 text-white"
            }`}
          >
            <MdFlashlightOn className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            setFacing((f) => (f === "environment" ? "user" : "environment"))
          }
          title="Switch camera"
          className="p-2 rounded-full bg-black/40 text-white backdrop-blur"
        >
          <MdCameraswitch className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
