"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScanLine, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function NfcReaderPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [showEnableButton, setShowEnableButton] = useState(false);
  const [faceVisible, setFaceVisible] = useState(false);
  const isSupported = typeof window !== "undefined" && "NDEFReader" in window;
  const readerRef = useRef(null);
  const hasAttemptedRef = useRef(false);
  const videoRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const decodeRecord = (record) => {
    if (!record?.data) return "";
    const bytes = new Uint8Array(record.data);

    // Web NFC text records are often WELL_KNOWN/RTD_TEXT with language byte prefix.
    if (record.recordType === "text" && record.mediaType == null && bytes.length > 0) {
      const languageLength = bytes[0] & 0x3f;
      const textBytes = bytes.slice(1 + languageLength);
      return new TextDecoder(record.encoding || "utf-8").decode(textBytes);
    }

    return new TextDecoder(record.encoding || "utf-8").decode(record.data);
  };

  const isFaceInsideGuide = (video, landmarks) => {
    if (!video || !Array.isArray(landmarks) || landmarks.length === 0) return false;
    const vw = video.videoWidth || 1;
    const vh = video.videoHeight || 1;
    const guide = {
      x: vw * 0.2,
      y: vh * 0.12,
      w: vw * 0.6,
      h: vh * 0.76,
    };

    const xs = landmarks.map((p) => p.x * vw);
    const ys = landmarks.map((p) => p.y * vh);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const faceAreaRatio = ((maxX - minX) * (maxY - minY)) / (vw * vh);

    const nose = landmarks[1] || landmarks[0];
    const cx = (nose?.x ?? 0.5) * vw;
    const cy = (nose?.y ?? 0.5) * vh;

    const centerInside =
      cx >= guide.x &&
      cx <= guide.x + guide.w &&
      cy >= guide.y &&
      cy <= guide.y + guide.h;

    return centerInside && faceAreaRatio >= 0.015;
  };

  const startScan = async () => {
    try {
      if (typeof window === "undefined") return;
      if (!("NDEFReader" in window)) {
        setStatus("NFC not supported on this browser/device.");
        setShowEnableButton(true);
        return;
      }

      if (!readerRef.current) {
        readerRef.current = new window.NDEFReader();
      }
      const reader = readerRef.current;
      setStatus("Hold the card near the reader...");
      setShowEnableButton(false);
      await reader.scan();
      setIsScanning(true);

      reader.onreading = (event) => {
        try {
          if (!faceVisible) {
            setStatus("Face not visible. Show face to scan.");
            return;
          }
          const record = event.message?.records?.[0];
          if (!record) return;
          decodeRecord(record);
          capturePhoto();
          setStatus("Card read successfully.");
        } catch (_error) {
          setStatus("Card detected but data could not be decoded.");
        }
      };

      reader.onreadingerror = () => {
        setStatus("Card detected but could not be read. Try again.");
      };
    } catch (_error) {
      setIsScanning(false);
      setStatus("Unable to start NFC scan. Check permissions and try again.");
      setShowEnableButton(true);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = photoCanvasRef.current;
    if (!video || !canvas || video.videoWidth <= 0 || video.videoHeight <= 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const drawLandmarks = (video, landmarks) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !video) return;
    const vw = video.videoWidth || 0;
    const vh = video.videoHeight || 0;
    if (!vw || !vh) return;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
    for (const p of landmarks) {
      const x = p.x * vw;
      const y = p.y * vh;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const startCameraAndFaceDetection = async () => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Camera not supported on this browser/device.");
      setShowEnableButton(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (_error) {
      setStatus("Camera permission is required.");
      setShowEnableButton(true);
      return;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      );
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
    } catch (_error) {
      setStatus("Face model unavailable.");
      setShowEnableButton(true);
      return;
    }

    const loop = () => {
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) {
        animationFrameRef.current = window.requestAnimationFrame(loop);
        return;
      }
      try {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result?.faceLandmarks?.[0] || [];
        if (!landmarks.length) {
          setFaceVisible(false);
          drawLandmarks(video, []);
        } else {
          drawLandmarks(video, landmarks);
          setFaceVisible(isFaceInsideGuide(video, landmarks));
        }
      } catch (_error) {
        setFaceVisible(false);
      }
      animationFrameRef.current = window.requestAnimationFrame(loop);
    };
    animationFrameRef.current = window.requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    (async () => {
      await startCameraAndFaceDetection();
      await startScan();
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (faceLandmarkerRef.current?.close) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="mx-auto h-full w-full max-w-4xl px-4 py-4 sm:px-6">
        <Card className="h-full">
          <CardContent className="h-full flex flex-col items-center justify-center gap-5 p-4 sm:p-6">
            <div className="w-full max-w-xl">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-black shadow-sm">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <canvas ref={overlayCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
              <div
                className={`pointer-events-none absolute inset-[12%_20%] rounded-2xl border-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)] ${
                  faceVisible ? "border-emerald-400/90" : "border-red-400/90"
                }`}
              />
              {!faceVisible ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-100 ring-1 ring-red-400/40">
                    Keep your face in frame
                  </div>
                </div>
              ) : (
                <div className="absolute top-2 right-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/40">
                  Face detected
                </div>
              )}
              </div>
            </div>
          <canvas ref={photoCanvasRef} className="hidden" />
            <div className="relative h-44 w-44 sm:h-48 sm:w-48 rounded-full border border-border bg-muted/30 flex items-center justify-center">
              <div className="absolute h-32 w-32 sm:h-36 sm:w-36 rounded-full border border-border/80" />
              <div className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-border/60" />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Radio className="h-7 w-7" />
                <ScanLine className="h-7 w-7" />
              </div>
            </div>
            {showEnableButton ? (
              <Button
                type="button"
                onClick={async () => {
                  await startCameraAndFaceDetection();
                  await startScan();
                }}
                disabled={isScanning}
                size="lg"
              >
                Enable NFC
              </Button>
            ) : null}
            <div className="text-sm text-muted-foreground text-center min-h-5">
              {faceVisible ? "Face visible." : "Face not visible."} {status}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

