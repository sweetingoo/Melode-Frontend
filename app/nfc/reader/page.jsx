"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScanLine, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { api } from "@/services/api-client";

const DEFAULT_NFC_PREFIX = (process.env.NEXT_PUBLIC_NFC_PREFIX || "melode:nfc:").trim();

const CCID_INTERFACE_CLASS = 0x0b;

// Chromium refuses claimInterface() for these classes on ordinary origins (WebUSB spec).
// https://wicg.github.io/webusb/#protected-interface-classes
const WEBUSB_PROTECTED_INTERFACE_CLASSES = new Set([
  0x01, 0x03, 0x08, 0x0b, 0x0e, 0x10, 0xe0,
]);

function pickWebUsbBulkInOutInterface(cfg) {
  let fallbackProtected = null;
  for (const iface of cfg?.interfaces || []) {
    for (const alt of iface.alternates || []) {
      const endpoints = alt.endpoints || [];
      if (!endpoints.length) continue;
      const inEp = endpoints.find((ep) => ep.direction === "in");
      const outEp = endpoints.find((ep) => ep.direction === "out");
      if (!inEp || !outEp) continue;
      const isProtected = WEBUSB_PROTECTED_INTERFACE_CLASSES.has(alt.interfaceClass);
      const row = {
        interfaceNumber: iface.interfaceNumber,
        alt,
        inEp,
        outEp,
        isProtected,
      };
      if (!isProtected) return row;
      if (!fallbackProtected) fallbackProtected = row;
    }
  }
  return fallbackProtected;
}

function usbDeviceHasCcidInterface(device) {
  for (const cfg of device.configurations || []) {
    for (const iface of cfg.interfaces || []) {
      for (const alt of iface.alternates || []) {
        if (alt.interfaceClass === CCID_INTERFACE_CLASS) return true;
      }
    }
  }
  return false;
}

export default function NfcReaderPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [showEnableButton, setShowEnableButton] = useState(false);
  const [faceVisible, setFaceVisible] = useState(false);
  const [nfcPrefix, setNfcPrefix] = useState(DEFAULT_NFC_PREFIX);
  const [tapPopup, setTapPopup] = useState(null);
  const [nfcDebugLog, setNfcDebugLog] = useState([]);
  const [usbBusy, setUsbBusy] = useState(false);
  const [usbConnected, setUsbConnected] = useState(false);
  const [usbDeviceLabel, setUsbDeviceLabel] = useState("");
  const isSupported = typeof window !== "undefined" && "NDEFReader" in window;
  const isUsbSupported = typeof window !== "undefined" && "usb" in navigator;
  const readerRef = useRef(null);
  const usbDeviceRef = useRef(null);
  const usbInterfaceRef = useRef(null);
  const usbInEndpointRef = useRef(null);
  const usbOutEndpointRef = useRef(null);
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

  const appendNfcDebugLog = (...parts) => {
    const line = parts
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join(" ");
    setNfcDebugLog((prev) => {
      const next = [...prev, line];
      return next.slice(-12);
    });
  };

  const appendUsbOpenFailureHints = (error) => {
    const msg = (error?.message || String(error || "")).toLowerCase();
    if (msg.includes("protected class")) {
      appendNfcDebugLog(
        "USB hint: Chrome blocks WebUSB from claiming CCID/smart-card (class 0x0B) and other protected classes on normal websites. This is a browser rule, not your reader being broken. Use Web NFC on Android, WebHID if the reader supports it, a vendor bulk interface, or a native bridge.",
      );
      return;
    }
    if (!msg.includes("access denied") && !msg.includes("securityerror") && !msg.includes("notallowederror")) {
      return;
    }
    appendNfcDebugLog(
      "USB hint: Windows often blocks open() if the Smart Card (PC/SC) stack or another app owns the reader. Quit vendor NFC/smart-card software, unplug/replug, try another port, and keep the page on https:// or localhost. Some managed PCs block WebUSB entirely.",
    );
  };

  const toHex = (value, width = 4) => `0x${value.toString(16).padStart(width, "0")}`;

  const bytesToHex = (bytes) => {
    if (!bytes?.length) return "";
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
  };

  const disconnectUsbReader = async () => {
    const device = usbDeviceRef.current;
    if (!device) return;
    try {
      if (device.opened && usbInterfaceRef.current != null) {
        await device.releaseInterface(usbInterfaceRef.current);
      }
    } catch (_error) {
      // Ignore release errors during cleanup.
    }
    try {
      if (device.opened) {
        await device.close();
      }
    } catch (_error) {
      // Ignore close errors during cleanup.
    }
    usbDeviceRef.current = null;
    usbInterfaceRef.current = null;
    usbInEndpointRef.current = null;
    usbOutEndpointRef.current = null;
    setUsbConnected(false);
    setUsbDeviceLabel("");
    appendNfcDebugLog("USB reader disconnected.");
  };

  const attachUsbDevice = async (device) => {
    if (!device.opened) {
      await device.open();
    }
    if (!device.configuration) {
      await device.selectConfiguration(1);
    }
    const cfg = device.configuration;
    const picked = pickWebUsbBulkInOutInterface(cfg);
    if (!picked) {
      throw new Error("No usable USB interface found.");
    }
    if (picked.isProtected) {
      if (picked.alt.interfaceClass === CCID_INTERFACE_CLASS) {
        throw new Error(
          "Chrome blocks WebUSB from claiming CCID/smart-card interfaces (class 0x0B) on ordinary websites.",
        );
      }
      throw new Error(
        `Chrome blocks WebUSB from claiming this USB interface (protected class 0x${picked.alt.interfaceClass.toString(16)}).`,
      );
    }

    await device.claimInterface(picked.interfaceNumber);
    if (picked.alt.alternateSetting != null) {
      await device.selectAlternateInterface(picked.interfaceNumber, picked.alt.alternateSetting);
    }

    usbDeviceRef.current = device;
    usbInterfaceRef.current = picked.interfaceNumber;
    usbInEndpointRef.current = picked.inEp.endpointNumber;
    usbOutEndpointRef.current = picked.outEp.endpointNumber;
    setUsbConnected(true);
    setUsbDeviceLabel(device.productName || `${toHex(device.vendorId)}:${toHex(device.productId)}`);
    appendNfcDebugLog(
      "USB connected:",
      device.productName || "(no product name)",
      `vid=${toHex(device.vendorId)}`,
      `pid=${toHex(device.productId)}`,
      `iface=${picked.interfaceNumber}`,
      `class=0x${picked.alt.interfaceClass.toString(16)}`,
      `epIn=${picked.inEp.endpointNumber}`,
      `epOut=${picked.outEp.endpointNumber}`,
    );
  };

  const connectUsbReader = async () => {
    if (typeof window === "undefined" || !("usb" in navigator)) {
      appendNfcDebugLog("WebUSB is not supported in this browser.");
      return;
    }
    setUsbBusy(true);
    try {
      if (usbDeviceRef.current) {
        await disconnectUsbReader();
      }
      const device = await navigator.usb.requestDevice({
        filters: [{ classCode: CCID_INTERFACE_CLASS }],
      });
      await attachUsbDevice(device);
    } catch (error) {
      appendNfcDebugLog("USB connect failed:", error?.message || "Unknown error");
      appendUsbOpenFailureHints(error);
      await disconnectUsbReader();
    } finally {
      setUsbBusy(false);
    }
  };

  const probeUsbReader = async () => {
    const device = usbDeviceRef.current;
    const inEndpoint = usbInEndpointRef.current;
    const outEndpoint = usbOutEndpointRef.current;
    if (!device || inEndpoint == null || outEndpoint == null) {
      appendNfcDebugLog("Probe skipped: USB reader is not connected.");
      return;
    }
    setUsbBusy(true);
    try {
      // CCID "Get Slot Status" command packet. Works on many USB smart-card readers.
      const command = new Uint8Array([0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);
      await device.transferOut(outEndpoint, command);
      appendNfcDebugLog("USB probe sent (CCID Get Slot Status).");
      const response = await device.transferIn(inEndpoint, 512);
      const data = response?.data ? new Uint8Array(response.data.buffer) : null;
      appendNfcDebugLog(
        "USB probe response:",
        `status=${response?.status || "unknown"}`,
        data?.length ? bytesToHex(data.slice(0, 64)) : "(no payload)",
      );
    } catch (error) {
      appendNfcDebugLog("USB probe failed:", error?.message || "Unknown error");
    } finally {
      setUsbBusy(false);
    }
  };

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
        appendNfcDebugLog("NDEFReader not available in this browser.");
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
      appendNfcDebugLog("Scan started. Waiting for NFC card/tag...");

      reader.onreading = async (event) => {
        try {
          const now = Date.now();
          if (now < readCooldownUntilRef.current) {
            return;
          }
          readCooldownUntilRef.current = now + 2200;

          const records = event.message?.records || [];
          appendNfcDebugLog(
            "Tag detected.",
            `serial=${event.serialNumber || "(not available)"}`,
            `records=${records.length}`,
          );
          for (const record of records) {
            appendNfcDebugLog(
              "Record:",
              `type=${record?.recordType || "unknown"}`,
              `mediaType=${record?.mediaType || ""}`,
            );
          }
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
            appendNfcDebugLog("Card read but payload is not an allowed Melode token.");
            playBeep("warning");
            setStatusWithReset("Unsupported card. Please use an authorized Melode card.");
            showTapPopup("error", "Unsuccessful");
            return;
          }
          appendNfcDebugLog("Allowed Melode token detected. Sending check-in request.");
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
            const summary = data?.clock_summary;
            if (action === "clocked_out") {
              popupTitle = "Check-out successful";
              const cot = summary?.clock_out_time;
              localCheckinTime = formatLocalDateTime(
                typeof cot === "string" ? cot : cot != null ? String(cot) : ""
              );
            } else if (action === "clocked_in") {
              const cit = summary?.clock_in_time;
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
            appendNfcDebugLog("API rejected check-in:", popupTitle);
          }
          setStatusWithReset(popupType === "success" ? "Card read successfully." : popupTitle);
          if (popupType === "success") {
            appendNfcDebugLog("Check-in request successful.");
          }
          showTapPopup(popupType, popupTitle, {
            name: identifiedName,
            avatarUrl: identifiedAvatarUrl,
            checkinTimeLocal: localCheckinTime,
          });
          window.setTimeout(() => {
            resetForNextCheckin();
          }, 3000);
        } catch (_error) {
          appendNfcDebugLog("Tag detected but record data could not be decoded.");
          setStatusWithReset("Card detected but data could not be decoded.");
          showTapPopup("error", "Check-in unsuccessful");
          window.setTimeout(() => {
            resetForNextCheckin();
          }, 3000);
        }
      };

      reader.onreadingerror = () => {
        appendNfcDebugLog("Tag detected but NDEF payload could not be read.");
        setStatus("Card detected but could not be read. Try again.");
      };
    } catch (_error) {
      setIsScanning(false);
      setStatus("Unable to start NFC scan. Check permissions and try again.");
      setShowEnableButton(true);
      appendNfcDebugLog("Failed to start scan. Check permissions/browser support.");
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
    if (typeof window === "undefined" || !("usb" in navigator)) return undefined;

    const restoreAuthorizedUsbReader = async () => {
      if (usbDeviceRef.current) return;
      let candidate = null;
      try {
        const devices = await navigator.usb.getDevices();
        candidate =
          devices.find(usbDeviceHasCcidInterface) || (devices.length === 1 ? devices[0] : null);
        if (!candidate) return;
        if (candidate.opened) {
          try {
            await candidate.close();
          } catch (_e) {
            // Stale session (e.g. React remount); reopen below.
          }
        }
        await attachUsbDevice(candidate);
        appendNfcDebugLog("USB session restored for this site (no picker needed).");
      } catch (error) {
        appendNfcDebugLog("USB auto-restore failed:", error?.message || String(error));
        appendUsbOpenFailureHints(error);
        if (candidate) {
          try {
            if (candidate.opened) await candidate.close();
          } catch (_e) {
            // ignore
          }
        }
      }
    };

    const onUsbDisconnect = (event) => {
      if (usbDeviceRef.current && event.device === usbDeviceRef.current) {
        usbDeviceRef.current = null;
        usbInterfaceRef.current = null;
        usbInEndpointRef.current = null;
        usbOutEndpointRef.current = null;
        setUsbConnected(false);
        setUsbDeviceLabel("");
        appendNfcDebugLog("USB reader unplugged.");
      }
    };

    void restoreAuthorizedUsbReader();
    navigator.usb.addEventListener("disconnect", onUsbDisconnect);
    navigator.usb.addEventListener("connect", restoreAuthorizedUsbReader);

    return () => {
      navigator.usb.removeEventListener("disconnect", onUsbDisconnect);
      navigator.usb.removeEventListener("connect", restoreAuthorizedUsbReader);
    };
    // Intentionally run once on mount; attachUsbDevice is stable for our purposes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- WebUSB restore + listeners
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" variant="outline" onClick={connectUsbReader} disabled={usbBusy || !isUsbSupported}>
                {usbConnected ? "Reconnect USB Reader" : "Connect USB Reader"}
              </Button>
              <Button type="button" variant="outline" onClick={probeUsbReader} disabled={usbBusy || !usbConnected}>
                Probe USB Reader
              </Button>
              <Button type="button" variant="ghost" onClick={disconnectUsbReader} disabled={usbBusy || !usbConnected}>
                Disconnect USB
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center min-h-4">
              {isUsbSupported
                ? usbConnected
                  ? `USB connected: ${usbDeviceLabel || "Reader"}`
                  : "USB reader not connected."
                : "WebUSB not supported on this browser/device."}
            </div>
            <div className="text-sm text-muted-foreground text-center min-h-5">
              {faceVisible ? "Face visible." : "Face not visible."} {status}
            </div>
            <div className="w-full max-w-xl rounded-md border bg-muted/20 p-3">
              <div className="text-xs font-medium text-muted-foreground mb-2">NFC diagnostics</div>
              <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {nfcDebugLog.length ? nfcDebugLog.join("\n") : "No NFC events yet."}
              </div>
            </div>
            <div className="w-full max-w-xl rounded-md border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground space-y-2">
              <div className="font-medium text-foreground/80">What these messages mean</div>
              <p>
                <span className="text-foreground/70">NDEFReader missing:</span> Phone-style tap-to-read uses Web NFC,
                which Chrome exposes on Android, not on typical laptop/desktop Chrome. Use an Android phone with Chrome
                for built-in NFC, or rely on a USB CCID reader here.
              </p>
              <p>
                <span className="text-foreground/70">USB Access denied:</span> The OS or another program is not allowing
                the browser to open the device. This is environmental (drivers, Smart Card service, policy), not a bug
                in this page. See the USB hint in the log after a failed connect.
              </p>
              <p>
                <span className="text-foreground/70">Protected class / CCID:</span> Chrome will not let ordinary sites
                claim USB smart-card (CCID, class 0x0B) interfaces over WebUSB. Most USB NFC readers only expose CCID, so
                the USB buttons here cannot drive them from the web. Prefer Web NFC on Android, or a non-WebUSB path
                (e.g. WebHID or a small native helper) if you need the laptop.
              </p>
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

