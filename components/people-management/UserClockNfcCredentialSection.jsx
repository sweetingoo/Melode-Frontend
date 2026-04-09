"use client";

import React from "react";
import Image from "next/image";
import { CreditCard, Eye, EyeOff, Info, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useClockNfcCredentialStatusForUser,
  useDisableClockNfcForUser,
  useEnableClockNfcForUser,
  useRotateClockNfcForUser,
} from "@/hooks/useClock";
import { api } from "@/services/api-client";
import { cn } from "@/lib/utils";

const DEFAULT_NFC_PREFIX = (process.env.NEXT_PUBLIC_NFC_PREFIX || "melode:nfc:").trim();
const MASKED_PAYLOAD = "•••••••••••••••••••••••••••••••••";

function formatUpdatedAt(iso) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(dt);
  } catch (_e) {
    return dt.toLocaleString();
  }
}

function statusBadgeClass(hasRecord, nfcEnabled) {
  if (!hasRecord) return "border-muted-foreground/25 bg-muted/50 text-muted-foreground";
  if (nfcEnabled) return "border-emerald-500/35 bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-200";
  return "border-amber-500/35 bg-amber-500/[0.12] text-amber-900 dark:text-amber-100";
}

function formatCredentialWindow(fromIso, toIso) {
  const from = formatUpdatedAt(fromIso);
  const to = formatUpdatedAt(toIso);
  if (from === "—" && to === "—") return "—";
  return `${from} — ${to}`;
}

function CredentialCardGraphic({ userName, muted, className }) {
  return (
    <div
      className={cn(
        "relative aspect-[85.6/53.98] w-full overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-black/20",
        muted && "opacity-75 saturate-[0.65]",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/18 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-teal-400/12 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1px,transparent_0)] [background-size:14px_14px]" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20">
              <Image src="/melode_logo_white.svg" alt="" width={20} height={20} priority className="opacity-95" />
            </div>
            <div className="hidden h-6 w-[72px] min-[380px]:block sm:w-[100px]">
              <Image src="/melode_logo_white.svg" alt="" width={100} height={24} priority className="opacity-90" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-1 text-white/70 ring-1 ring-white/10">
            <ScanLine className="h-3.5 w-3.5" aria-hidden />
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
          </div>
        </div>

        <div className="h-8 w-12 rounded-md bg-gradient-to-br from-amber-200/95 via-amber-100/85 to-amber-200/80 shadow-sm ring-1 ring-amber-100/40" />

        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-base font-semibold tracking-wide sm:text-lg">{userName || "—"}</p>
          <p className="text-xs font-medium text-white/60">NFC card</p>
        </div>
      </div>
    </div>
  );
}

/** NFC / wallet credential for a person (manager: ``user:update``). */
export function UserClockNfcCredentialSection({ userSlug, userName }) {
  const rotateMutation = useRotateClockNfcForUser();
  const disableMutation = useDisableClockNfcForUser();
  const enableMutation = useEnableClockNfcForUser();
  const { data: statusData, isLoading: statusLoading } = useClockNfcCredentialStatusForUser(userSlug);
  const hasRecord = statusData?.has_credential === true;
  const nfcEnabled = hasRecord && statusData?.is_enabled !== false;
  const [nfcPrefix, setNfcPrefix] = React.useState(DEFAULT_NFC_PREFIX);
  const [tagPayload, setTagPayload] = React.useState("");
  const [revealSecret, setRevealSecret] = React.useState(false);

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

  React.useEffect(() => {
    const token = typeof statusData?.token === "string" ? statusData.token.trim() : "";
    if (hasRecord && token && nfcPrefix) {
      setTagPayload(`${nfcPrefix}${token}`);
    } else if (!hasRecord) {
      setTagPayload("");
    }
  }, [statusData?.token, hasRecord, nfcPrefix]);

  React.useEffect(() => {
    if (!hasRecord) {
      setRevealSecret(false);
    }
  }, [hasRecord]);

  const handleRotate = async () => {
    if (!userSlug) return;
    try {
      const result = await rotateMutation.mutateAsync({ userSlug });
      const token = typeof result?.token === "string" ? result.token.trim() : "";
      if (token) {
        setTagPayload(`${nfcPrefix}${token}`);
      }
      setRevealSecret(false);
    } catch {
      /* logged in hook */
    }
  };

  const statusLabel = !hasRecord ? "Not issued" : nfcEnabled ? "Active" : "Disabled";
  const canToggleReveal = Boolean(tagPayload);
  const updatedLabel = formatUpdatedAt(statusData?.updated_at);
  const supersededList = React.useMemo(() => {
    const raw = statusData?.superseded_credentials;
    if (!Array.isArray(raw)) return [];
    return [...raw].sort((x, y) => {
      const tx = new Date(x?.valid_until ?? 0).getTime();
      const ty = new Date(y?.valid_until ?? 0).getTime();
      return ty - tx;
    });
  }, [statusData?.superseded_credentials]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border">
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
          </span>
          Cards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        <ul className="divide-y">
          <li className="px-4 py-8 sm:px-6">
            <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
              <div className="relative mx-auto w-full max-w-[300px] shrink-0 md:mx-0">
                <CredentialCardGraphic userName={userName} muted={!hasRecord || !nfcEnabled} />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-medium leading-tight">Melode clock NFC</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          <span className="text-muted-foreground/80">Last updated</span>{" "}
                          <span className="tabular-nums">{updatedLabel}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center sm:pl-2">
                      <Badge
                        variant="outline"
                        className={cn("px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(hasRecord, nfcEnabled))}
                      >
                        {statusLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                  <div className="flex w-full min-w-0 items-start gap-1 sm:w-auto sm:max-w-xl sm:items-center">
                    <Button
                      onClick={handleRotate}
                      disabled={rotateMutation.isPending || statusLoading || !userSlug}
                      className="h-auto min-h-9 flex-1 justify-center whitespace-normal px-3 py-2 text-center text-xs leading-snug sm:flex-initial sm:text-left"
                    >
                      {rotateMutation.isPending || statusLoading ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                      ) : hasRecord ? (
                        "Generate new NFC that will disable the old NFC"
                      ) : (
                        "Generate NFC"
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-0.5 h-8 w-8 shrink-0 text-muted-foreground sm:mt-0"
                          aria-label="About generating an NFC credential"
                        >
                          <Info className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-balance">
                        A new tag string is created and the previous NFC stops working until you program a tag with the new
                        string.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      disabled={!hasRecord || nfcEnabled || enableMutation.isPending || statusLoading || !userSlug}
                      onClick={async () => {
                        if (!userSlug) return;
                        await enableMutation.mutateAsync({ userSlug });
                      }}
                    >
                      {enableMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Enable NFC"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          className="flex-1 sm:flex-none"
                          disabled={!hasRecord || !nfcEnabled || disableMutation.isPending || statusLoading || !userSlug}
                        >
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
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">NFC tag write string</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={!canToggleReveal}
                      aria-label={revealSecret ? "Hide NFC write string" : "Show NFC write string"}
                      aria-pressed={revealSecret}
                      onClick={() => setRevealSecret((v) => !v)}
                    >
                      {revealSecret ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                    </Button>
                  </div>
                  <div className="mt-3 rounded-lg border bg-background px-3 py-2.5 font-mono text-xs leading-relaxed break-all text-muted-foreground">
                    {!tagPayload ? "—" : revealSecret ? tagPayload : MASKED_PAYLOAD}
                  </div>
                </div>
              </div>
            </div>
          </li>

          {supersededList.map((item) => (
            <li key={`${item.valid_from}-${item.valid_until}`} className="px-4 py-6 sm:px-6">
              <div className="flex w-full flex-col gap-5 md:flex-row md:items-stretch md:gap-8 lg:gap-10">
                <div className="relative mx-auto w-full max-w-[300px] shrink-0 md:mx-0">
                  <CredentialCardGraphic userName={userName} muted />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl border border-muted-foreground/15 bg-muted/10 text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">Melode clock NFC</p>
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground sm:text-sm">
                          {formatCredentialWindow(item.valid_from, item.valid_until)}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit shrink-0 border-muted-foreground/30 text-muted-foreground">
                        Replaced
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
