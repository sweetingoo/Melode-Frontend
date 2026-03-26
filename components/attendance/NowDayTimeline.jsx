"use client";

import React, { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/attendanceLabels";

const KIND_META = {
  clock: {
    label: "Clocked in",
    barClass: "bg-violet-500/90 border-violet-600 text-white shadow-sm z-[3]",
    legendClass: "bg-violet-500/80 border border-violet-600",
  },
  provisional: {
    label: CATEGORY_LABELS.provisional,
    barClass: "bg-blue-500/40 border border-blue-500/55 text-blue-950 dark:text-blue-100 z-[1]",
    legendClass: "bg-blue-500/40 border border-blue-500/55",
  },
  authorised_leave: {
    label: CATEGORY_LABELS.authorised_leave,
    barClass: "bg-emerald-500/40 border border-emerald-600/45 text-emerald-950 dark:text-emerald-100 z-[1]",
    legendClass: "bg-emerald-500/40 border border-emerald-600/45",
  },
  unauthorised_leave: {
    label: CATEGORY_LABELS.unauthorised_leave,
    barClass: "bg-amber-500/40 border border-amber-600/45 text-amber-950 dark:text-amber-100 z-[1]",
    legendClass: "bg-amber-500/40 border border-amber-600/45",
  },
};

function formatRange(startMin, endMin) {
  const sh = Math.floor(startMin / 60) % 24;
  const sm = Math.floor(startMin % 60);
  const eh = Math.floor(endMin / 60) % 24;
  const em = Math.floor(endMin % 60);
  return `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}–${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

/**
 * Day timeline: hour axis, one row per person, stacked bars (leave / allocated under clock).
 * Dotted vertical line at current time when `isToday` and time falls inside the window.
 */
export function NowDayTimeline({
  rows = [],
  windowStartMin = 6 * 60,
  windowEndMin = 21 * 60,
  nowMinutes = null,
  isToday = false,
  className,
}) {
  const span = Math.max(1, windowEndMin - windowStartMin);
  const [tickNow, setTickNow] = useState(nowMinutes);

  useEffect(() => {
    if (!isToday) return;
    const t = setInterval(() => {
      const d = new Date();
      setTickNow(d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60);
    }, 30 * 1000);
    return () => clearInterval(t);
  }, [isToday]);

  useEffect(() => {
    setTickNow(nowMinutes);
  }, [nowMinutes]);

  const hourTicks = useMemo(() => {
    const startH = Math.floor(windowStartMin / 60);
    const endH = Math.ceil(windowEndMin / 60);
    const ticks = [];
    for (let h = startH; h <= endH; h++) {
      const m = h * 60;
      if (m < windowStartMin - 0.01 || m > windowEndMin + 0.01) continue;
      const leftPct = ((m - windowStartMin) / span) * 100;
      ticks.push({ m, leftPct, label: `${String(h % 24).padStart(2, "0")}:00` });
    }
    return ticks;
  }, [windowStartMin, windowEndMin, span]);

  const nowLinePct =
    isToday && tickNow != null && tickNow >= windowStartMin && tickNow <= windowEndMin
      ? ((tickNow - windowStartMin) / span) * 100
      : null;

  const deptColW = 90;
  const roleColW = 140;
  const rowHClass = "h-[72px]";
  const rowH = 72;
  const gridMinW = 640;

  if (!rows.length) {
    return (
      <div className={cn("rounded-xl border border-dashed bg-muted/20 py-16 text-center text-sm text-muted-foreground", className)}>
        No people or shifts in this view for the selected day and filters.
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm overflow-hidden", className)}>
      <div className="flex w-full">
        <div className="shrink-0 border-r bg-muted/20" style={{ width: deptColW + roleColW }}>
          <div className="h-10 border-b" />
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: deptColW }} />
              <col style={{ width: roleColW }} />
            </colgroup>
            <tbody>
              {(() => {
                const deptKey = (v) => String(v ?? "—");

                const out = [];
                let i = 0;
                while (i < rows.length) {
                  const dept = rows[i].departmentName || "—";
                  let deptEnd = i + 1;
                  while (deptEnd < rows.length && deptKey(rows[deptEnd].departmentName) === deptKey(dept)) {
                    deptEnd++;
                  }
                  const deptRowSpan = deptEnd - i;

                  let j = i;
                  while (j < deptEnd) {
                    const role = rows[j].roleName || "—";
                    let roleEnd = j + 1;
                    while (roleEnd < deptEnd && deptKey(rows[roleEnd].roleName) === deptKey(role)) {
                      roleEnd++;
                    }
                    const roleRowSpan = roleEnd - j;

                    for (let k = j; k < roleEnd; k++) {
                      out.push(
                        <tr
                          key={`left-${rows[k].groupId ?? "grp"}-${rows[k].laneIndex ?? k}-${k}`}
                          style={{ height: rowH, minHeight: rowH, maxHeight: rowH, lineHeight: 1 }}
                          className={rowHClass}
                        >
                          {k === i ? (
                            <td
                              rowSpan={deptRowSpan}
                              className="align-middle text-center border-r border-border/60 border-b border-border/60"
                              style={{ padding: 0, height: rowH, minHeight: rowH, maxHeight: rowH, verticalAlign: "middle" }}
                            >
                              <span
                                className="text-[7px] font-semibold uppercase tracking-normal text-muted-foreground leading-none inline-block"
                                style={{
                                  writingMode: "vertical-rl",
                                  textOrientation: "mixed",
                                  transform: "rotate(180deg)",
                                }}
                                title={dept}
                              >
                                {dept}
                              </span>
                            </td>
                          ) : null}
                          {k === j ? (
                            <td
                              rowSpan={roleRowSpan}
                              className="align-middle text-center border-l border-border/60 border-b border-border/60"
                              style={{ padding: 0, height: rowH, minHeight: rowH, maxHeight: rowH, verticalAlign: "middle" }}
                            >
                              <span
                                className="text-[7px] font-semibold uppercase tracking-normal text-muted-foreground leading-none inline-block"
                                style={{
                                  writingMode: "vertical-rl",
                                  textOrientation: "mixed",
                                  transform: "rotate(180deg)",
                                }}
                                title={role}
                              >
                                {role}
                              </span>
                            </td>
                          ) : null}
                        </tr>
                      );
                    }

                    j = roleEnd;
                  }

                  i = deptEnd;
                }

                return out;
              })()}
            </tbody>
          </table>
        </div>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="relative" style={{ minWidth: gridMinW }}>
            {nowLinePct != null && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-20 border-l-2 border-dashed border-rose-500"
                style={{ left: `${nowLinePct}%`, transform: "translateX(-1px)" }}
                aria-hidden
              />
            )}
            <div className="relative h-10 border-b bg-muted/30">
              {hourTicks.map((t) => (
                <div
                  key={t.m}
                  className="absolute top-0 bottom-0 border-l border-border/50 text-[10px] text-muted-foreground"
                  style={{ left: `${t.leftPct}%` }}
                >
                  <span className="absolute left-1 top-1 whitespace-nowrap font-medium">{t.label}</span>
                </div>
              ))}
            </div>
            {rows.map((row, rowIndex) => {
              const nextRow = rows[rowIndex + 1];
              const isLastRow = rowIndex === rows.length - 1;
              const roleBoundary = !nextRow || nextRow.roleName !== row.roleName;
              const deptBoundary = !nextRow || nextRow.departmentName !== row.departmentName;
              const showBottomBorder = !isLastRow && (roleBoundary || deptBoundary);

              return (
              <div
                key={`${row.groupId ?? row.userId ?? "row"}-${row.laneIndex ?? rowIndex}`}
                className={`relative ${rowHClass} ${showBottomBorder ? "border-b border-border/60" : ""}`}
                style={{ height: rowH, minHeight: rowH, maxHeight: rowH }}
              >
                {hourTicks.map((t) => (
                  <div
                    key={`g-${row.groupId ?? row.userId ?? rowIndex}-${t.m}`}
                    className="pointer-events-none absolute top-0 bottom-0 border-l border-border/15"
                    style={{ left: `${t.leftPct}%` }}
                  />
                ))}
                <div className="absolute inset-x-0 top-2 bottom-2">
                  {(row.segments || []).map((seg, idx) => {
                    const left = ((seg.startMin - windowStartMin) / span) * 100;
                    const width = ((seg.endMin - seg.startMin) / span) * 100;
                    if (width <= 0) return null;
                    const meta = KIND_META[seg.kind] || KIND_META.provisional;
                    return (
                      <div
                        key={`${seg.kind}-${idx}-${seg.startMin}-${seg.endMin}`}
                        className={cn(
                          "absolute top-0 flex h-full min-w-[3px] items-center overflow-hidden rounded-md px-1 text-[10px] font-medium leading-tight",
                          meta.barClass
                        )}
                        style={{ left: `${left}%`, width: `${Math.max(width, 0.35)}%` }}
                        title={
                          seg.title || `${meta.label}: ${formatRange(seg.startMin, seg.endMin)}`
                        }
                      >
                        <span className="truncate">{seg.shortLabel || meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        {Object.entries(KIND_META).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-2">
            <span className={cn("h-3 w-7 shrink-0 rounded-sm", v.legendClass)} />
            {v.label}
          </span>
        ))}
        {isToday && (
          <span className="inline-flex items-center gap-2">
            <span className="h-0 w-8 shrink-0 border-t-2 border-dashed border-rose-500" />
            Current time
          </span>
        )}
      </div>
    </div>
  );
}
