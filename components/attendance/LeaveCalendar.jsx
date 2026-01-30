"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useLeaveCalendar } from "@/hooks/useAttendanceReports";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const LeaveCalendar = ({ departmentId = null, roleId = null }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: calendarData, isLoading } = useLeaveCalendar({
    start_date: format(startDate, "yyyy-MM-dd"),
    end_date: format(endDate, "yyyy-MM-dd"),
    department_id: departmentId,
    role_id: roleId,
  });

  const events = calendarData || [];

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const grouped = {};
    events.forEach((event) => {
      const dateKey = event.start_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return eventsByDate[dateKey] || [];
  };

  // Custom day renderer with event indicators
  const modifiers = {
    hasLeave: (date) => {
      const dateEvents = getEventsForDate(date);
      return dateEvents.length > 0;
    },
  };

  const modifiersClassNames = {
    hasLeave: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
  };

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Leave Calendar</CardTitle>
          <CardDescription>View approved leave requests on the calendar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date to view leave"}
                  </h3>
                  {selectedDateEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leave scheduled for this date</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-lg border p-3"
                          style={{
                            borderLeftColor: event.leave_type_color || "#3b82f6",
                            borderLeftWidth: "4px",
                          }}
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: event.leave_type_color || "#3b82f6" }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.user_name || "Unknown User"}</p>
                            <p className="text-xs text-muted-foreground">{event.leave_type || "Leave"}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.total_hours}h
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Legend</p>
                  <div className="space-y-1">
                    {Array.from(new Set(events.map((e) => e.leave_type))).map((leaveType) => {
                      const event = events.find((e) => e.leave_type === leaveType);
                      return (
                        <div key={leaveType} className="flex items-center gap-2 text-xs">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: event?.leave_type_color || "#3b82f6" }}
                          />
                          <span>{leaveType}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
