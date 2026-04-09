"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScanLine, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { api } from "@/services/api-client";

const DEFAULT_NFC_PREFIX = (process.env.NEXT_PUBLIC_NFC_PREFIX || "melode:nfc:").trim();

export default function NfcReaderPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [showEnableButton, setShowEnableButton] = useState(false);
  const [faceVisible, setFaceVisible] = useState(false);
  const [nfcPrefix, setNfcPrefix] = useState(DEFAULT_NFC_PREFIX);
  const [tapPopup, setTapPopup] = useState(null);
  const isSupported = typeof window !== "undefined" && "NDEFReader" in window;
  const readerRef = useRef(null);
  const faceVisibleRef = useRef(false);
  const nfcPrefixRef = useRef(DEFAULT_NFC_PREFIX);
  const hasAttemptedRef = useRef(false);
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const popupTimerRef = useRef(null);
  const statusTimerRef = useRef(null);
  const readCooldownUntilRef = useRef(0);

  const showTapPopup = (type, message, details = {}) => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }
    setTapPopup({ type, message, ...details });
    popupTimerRef.current = window.setTimeout(() => {
      setTapPopup(null);
      popupTimerRef.current = null;
    }, 2200);
  };

  const setStatusWithReset = (message, resetMs = 2200) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }
    setStatus(message);
    statusTimerRef.current = window.setTimeout(() => {
      setStatus("");
      statusTimerRef.current = null;
    }, resetMs);
  };

  const resetForNextCheckin = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    setTapPopup(null);
    setStatus("Ready for next check-in.");
    readCooldownUntilRef.current = 0;
  };

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

  const formatLocalDateTime = (utcIsoString) => {
    if (!utcIsoString) return "";
    const dt = new Date(utcIsoString);
    if (Number.isNaN(dt.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(dt);
    } catch (_error) {
      return dt.toLocaleString();
    }
  };

  const extractAllowedToken = (record) => {
    const payload = decodeRecord(record)?.trim();
    const prefix = nfcPrefixRef.current || DEFAULT_NFC_PREFIX;
    if (!payload || !payload.startsWith(prefix)) return null;
    const token = payload.slice(prefix.length).trim();
    return token || null;
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

      reader.onreading = async (event) => {
        try {
          const now = Date.now();
          if (now < readCooldownUntilRef.current) {
            return;
          }
          readCooldownUntilRef.current = now + 2200;

          const records = event.message?.records || [];
          if (records.length > 1) {
            playBeep("warning");
            setStatusWithReset("Multiple NFC tags detected. Please tap one card at a time.");
            showTapPopup("error", "Unsuccessful");
            return;
          }
          const record = records[0];
          if (!record) {
            setStatusWithReset("Card detected but no data was found.");
            showTapPopup("error", "Unsuccessful");
            return;
          }
          if (!faceVisibleRef.current) {
            playBeep("warning");
            setStatusWithReset("Face not visible. Show face to scan.");
            showTapPopup("error", "Unsuccessful");
            return;
          }
          const allowedToken = extractAllowedToken(record);
          if (!allowedToken) {
            playBeep("warning");
            setStatusWithReset("Unsupported card. Please use an authorized Melode card.");
            showTapPopup("error", "Unsuccessful");
            return;
          }
          let identifiedName = "";
          let identifiedAvatarUrl = "";
          let localCheckinTime = "";
          let popupTitle = "Check-in successful";
          let popupType = "success";
          try {
            const checkInRes = await api.post("/clock/nfc-reader/check-in", { token: allowedToken });
            const data = checkInRes?.data;
            identifiedName = data?.display_name || "";
            identifiedAvatarUrl = data?.avatar_url || "";
            const action = data?.action;
            if (action === "clocked_out") {
              popupTitle = "Check-out successful";
              const cot = data?.clock_record?.clock_out_time;
              localCheckinTime = formatLocalDateTime(
                typeof cot === "string" ? cot : cot != null ? String(cot) : ""
              );
            } else if (action === "clocked_in") {
              const cit = data?.clock_record?.clock_in_time;
              localCheckinTime = formatLocalDateTime(
                typeof cit === "string" ? cit : cit != null ? String(cit) : ""
              );
            }
            playBeep("success");
          } catch (error) {
            const detail = error?.response?.data?.detail;
            popupType = "error";
            popupTitle =
              typeof detail === "string" && detail.trim()
                ? detail
                : "Unsuccessful";
            playBeep("warning");
          }
          setStatusWithReset(popupType === "success" ? "Card read successfully." : popupTitle);
          showTapPopup(popupType, popupTitle, {
            name: identifiedName,
            avatarUrl: identifiedAvatarUrl,
            checkinTimeLocal: localCheckinTime,
          });
          window.setTimeout(() => {
            resetForNextCheckin();
          }, 3000);
        } catch (_error) {
          setStatusWithReset("Card detected but data could not be decoded.");
          showTapPopup("error", "Check-in unsuccessful");
          window.setTimeout(() => {
            resetForNextCheckin();
          }, 3000);
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

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  };

  const playTone = (ctx, frequency, durationMs, startAt) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.15, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationMs / 1000 + 0.02);
  };

  const playBeep = async (mode) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (_error) {
        return;
      }
    }
    const now = ctx.currentTime;
    if (mode === "warning") {
      playTone(ctx, 520, 120, now);
      playTone(ctx, 420, 160, now + 0.17);
      return;
    }
    playTone(ctx, 980, 120, now);
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
          faceVisibleRef.current = false;
          setFaceVisible(false);
          drawLandmarks(video, []);
        } else {
          drawLandmarks(video, landmarks);
          const isVisible = isFaceInsideGuide(video, landmarks);
          faceVisibleRef.current = isVisible;
          setFaceVisible(isVisible);
        }
      } catch (_error) {
        faceVisibleRef.current = false;
        setFaceVisible(false);
      }
      animationFrameRef.current = window.requestAnimationFrame(loop);
    };
    animationFrameRef.current = window.requestAnimationFrame(loop);
  };

  useEffect(() => {
    nfcPrefixRef.current = nfcPrefix;
  }, [nfcPrefix]);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get("/clock/nfc-reader-config");
        const serverPrefix = response?.data?.nfc_card_prefix;
        if (typeof serverPrefix === "string" && serverPrefix.trim()) {
          setNfcPrefix(serverPrefix.trim());
        }
      } catch (_error) {
        setNfcPrefix(DEFAULT_NFC_PREFIX);
      }
    })();
  }, []);

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
      if (audioContextRef.current?.state && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
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
            {tapPopup ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
                <div
                  className={`rounded-xl px-6 py-4 text-base font-semibold shadow-xl ring-1 min-w-[240px] max-w-[92vw] ${
                    tapPopup.type === "success"
                      ? "bg-emerald-600/95 text-white ring-emerald-400/50"
                      : "bg-red-600/95 text-white ring-red-400/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {tapPopup.type === "success" ? (
                      tapPopup.avatarUrl ? (
                        <Image
                          src={tapPopup.avatarUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white/50"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-white/20 ring-2 ring-white/40" />
                      )
                    ) : null}
                    <div className="min-w-0">
                      <div>{tapPopup.message}</div>
                      {tapPopup.type === "success" && tapPopup.name ? (
                        <div className="mt-1 text-sm font-medium text-white/90 truncate">
                          {tapPopup.name}
                        </div>
                      ) : null}
                      {tapPopup.type === "success" && tapPopup.checkinTimeLocal ? (
                        <div className="mt-1 text-xs font-medium text-white/80">
                          {tapPopup.checkinTimeLocal}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

