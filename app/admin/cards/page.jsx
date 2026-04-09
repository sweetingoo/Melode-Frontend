"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CreditCard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/useAuth";
import { useClockNfcCredentialStatus } from "@/hooks/useClock";
import { useClockNfcWalletLinks } from "@/hooks/useClock";

function AppleMark(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M16.8 13.1c0 2.6 2.3 3.4 2.4 3.5-.1.2-.4 1.3-1.3 2.5-.8 1-1.7 2-3 2-1.2 0-1.6-.7-3-.7s-1.9.7-3 .7c-1.2 0-2.1-1.1-3-2.3-1.6-2.2-2.9-6.1-1.2-8.8.8-1.3 2.2-2.1 3.7-2.1 1.2 0 2.2.8 3 .8.7 0 2-.9 3.4-.8.6 0 2.4.2 3.5 1.8-.1.1-2.1 1.2-2.1 3.4Zm-2.3-5.2c.6-.7 1-1.7.9-2.7-.9.1-2 .6-2.7 1.3-.6.7-1 1.7-.9 2.7 1 0 2-.6 2.7-1.3Z"
      />
    </svg>
  );
}

function GoogleMark(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 10.2v3.7h5.2c-.2 1.2-1.4 3.6-5.2 3.6-3.1 0-5.7-2.6-5.7-5.8S8.9 6 12 6c1.8 0 3 0.8 3.7 1.4l2.5-2.4C16.8 3.7 14.7 2.7 12 2.7 7 2.7 2.9 6.9 2.9 11.9S7 21.1 12 21.1c5.8 0 9.1-4.1 9.1-9.8 0-.7-.1-1.1-.2-1.6H12Z"
      />
    </svg>
  );
}

export default function AdminCardsPage() {
  const { data: currentUser } = useCurrentUser();
  const displayName = currentUser?.display_name || currentUser?.name || currentUser?.username || "";
  const { data: nfcStatus } = useClockNfcCredentialStatus();
  const isIssued = nfcStatus?.has_credential === true;
  const isNfcActive = isIssued && nfcStatus?.is_enabled !== false;
  const { data: walletLinks } = useClockNfcWalletLinks({ enabled: isNfcActive });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Cards</h1>
        </div>
      </div>

      <Card>
        <CardContent className="min-h-[70vh] flex items-center justify-center pt-6">
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!isNfcActive || !walletLinks?.apple_wallet_url}
                onClick={() => walletLinks?.apple_wallet_url && window.open(walletLinks.apple_wallet_url, "_blank", "noopener,noreferrer")}
              >
                <AppleMark className="h-5 w-5 mr-2" />
                Add to Apple Wallet
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!isNfcActive || !walletLinks?.google_wallet_url}
                onClick={() => walletLinks?.google_wallet_url && window.open(walletLinks.google_wallet_url, "_blank", "noopener,noreferrer")}
              >
                <GoogleMark className="h-5 w-5 mr-2" />
                Add to Google Wallet
              </Button>
            </div>

            <div className="relative aspect-[16/9] w-full rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Soft glow */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" />

              {/* Subtle texture */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1px,transparent_0)] [background-size:18px_18px]" />

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

                {/* “Chip” */}
                <div className="mt-8">
                  <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-amber-200/90 via-amber-100/80 to-amber-200/70 ring-1 ring-white/20 shadow-sm" />
                </div>

                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-semibold tracking-wide truncate">
                    {displayName || "—"}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-white/70">
                    <span>NFC card</span>
                  </div>
                </div>

                <div className="text-sm text-white/70 max-w-[28rem]">
                  Tap your card on the premises tablet to check in and check out.
                </div>
              </div>

              {!isIssued ? (
                <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200 ring-1 ring-red-400/30 backdrop-blur">
                  Not Issued
                </div>
              ) : !isNfcActive ? (
                <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-100 ring-1 ring-amber-400/30 backdrop-blur">
                  Disabled
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              <div className="font-medium text-foreground mb-2">How to use</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tap your card on the premises tablet.</li>
                <li>Hold for a moment until check-in or check-out registers.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

