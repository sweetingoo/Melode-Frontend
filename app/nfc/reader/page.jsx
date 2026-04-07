"use client";

import React, { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NfcReaderPage() {
  const [value, setValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const isSupported = typeof window !== "undefined" && "NDEFReader" in window;

  const startScan = async () => {
    try {
      if (typeof window === "undefined") return;
      if (!("NDEFReader" in window)) return;

      setIsScanning(true);
      const reader = new window.NDEFReader();
      await reader.scan();

      reader.onreading = (event) => {
        try {
          const record = event.message?.records?.[0];
          if (!record) return;
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding || "utf-8");
            setValue(textDecoder.decode(record.data));
            return;
          }
          if (record.recordType === "url") {
            const textDecoder = new TextDecoder("utf-8");
            setValue(textDecoder.decode(record.data));
            return;
          }
          const textDecoder = new TextDecoder("utf-8");
          setValue(textDecoder.decode(record.data));
        } catch {
          // ignore
        }
      };
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <Card>
        <CardContent className="min-h-[70vh] flex flex-col items-center justify-center gap-6 pt-6">
          <Button
            type="button"
            onClick={startScan}
            disabled={isScanning || !isSupported}
            className="h-40 w-40 rounded-full p-0"
            aria-label="Scan NFC"
          >
            <ScanLine className="h-14 w-14" />
          </Button>
          <div className="w-full max-w-md">
            <Input value={value} readOnly />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

