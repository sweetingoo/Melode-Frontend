"use client";

import React, { useEffect, useRef, useState } from "react";
import { ScanLine, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NfcReaderPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [showEnableButton, setShowEnableButton] = useState(false);
  const isSupported = typeof window !== "undefined" && "NDEFReader" in window;
  const readerRef = useRef(null);
  const hasAttemptedRef = useRef(false);

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
          const record = event.message?.records?.[0];
          if (!record) return;
          decodeRecord(record);
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

  useEffect(() => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    startScan();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <Card>
        <CardContent className="min-h-[70vh] flex flex-col items-center justify-center gap-6 pt-6">
          <div className="relative h-48 w-48 rounded-full border border-border bg-muted/30 flex items-center justify-center">
            <div className="absolute h-36 w-36 rounded-full border border-border/80" />
            <div className="absolute h-24 w-24 rounded-full border border-border/60" />
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Radio className="h-7 w-7" />
              <ScanLine className="h-7 w-7" />
            </div>
          </div>
          {showEnableButton ? (
            <Button type="button" onClick={startScan} disabled={isScanning} size="lg">
              Enable NFC
            </Button>
          ) : null}
          <div className="text-sm text-muted-foreground text-center min-h-5">{status}</div>
        </CardContent>
      </Card>
    </div>
  );
}

