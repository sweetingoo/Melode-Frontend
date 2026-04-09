"use client";

import React from "react";
import Image from "next/image";
import { Loader2, CreditCard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useClockNfcCredentialStatusForUser, useDisableClockNfcForUser, useRotateClockNfcForUser } from "@/hooks/useClock";
import { api } from "@/services/api-client";

const DEFAULT_NFC_PREFIX = (process.env.NEXT_PUBLIC_NFC_PREFIX || "melode:nfc:").trim();

/** NFC / wallet credential for a person (manager: ``user:update``). */
export function UserClockNfcCredentialSection({ userSlug, userName }) {
  const rotateMutation = useRotateClockNfcForUser();
  const disableMutation = useDisableClockNfcForUser();
  const { data: statusData, isLoading: statusLoading } = useClockNfcCredentialStatusForUser(userSlug);
  const isIssued = statusData?.has_credential === true;
  const [nfcPrefix, setNfcPrefix] = React.useState(DEFAULT_NFC_PREFIX);
  const [tagPayload, setTagPayload] = React.useState("");

  React.useEffect(() => {
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

  const handleRotate = async () => {
    if (!userSlug) return;
    try {
      const result = await rotateMutation.mutateAsync({ userSlug });
      const token = typeof result?.token === "string" ? result.token.trim() : "";
      if (token) {
        setTagPayload(`${nfcPrefix}${token}`);
      }
    } catch {
      /* logged in hook */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          Cards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-[16/9] w-full rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1px,transparent_0)] [background-size:18px_18px]" />

          {!isIssued ? (
            <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200 ring-1 ring-red-400/30 backdrop-blur">
              Not Issued
            </div>
          ) : null}

          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                  <Image src="/melode_logo_white.svg" alt="" width={22} height={22} priority className="opacity-90" />
                </div>
                <div className="h-7 w-[120px] hidden sm:block">
                  <Image src="/melode_logo_white.svg" alt="" width={120} height={28} priority className="opacity-90" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <ScanLine className="h-5 w-5" />
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-8">
              <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-amber-200/90 via-amber-100/80 to-amber-200/70 ring-1 ring-white/20 shadow-sm" />
            </div>

            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-semibold tracking-wide truncate">
                {userName || "—"}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                <span>NFC card</span>
              </div>
            </div>

            <div className="text-sm text-white/70 max-w-[28rem]">
              Tap at an NFC reader to check in and check out.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleRotate} disabled={rotateMutation.isPending || statusLoading || !userSlug}>
            {rotateMutation.isPending || statusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : isIssued ? (
              "Regenerate credential"
            ) : (
              "Generate credential"
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={!isIssued || disableMutation.isPending || statusLoading || !userSlug}>
                {disableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Disable NFC"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable NFC</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await disableMutation.mutateAsync({ userSlug });
                  }}
                >
                  Disable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Write this string to NFC tag</div>
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono break-all">
            {tagPayload || `${nfcPrefix}<token shown after generate>`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
