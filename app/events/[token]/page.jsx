"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { calendarEventsService } from "@/services/calendarEvents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PublicEventPage() {
  const params = useParams();
  const token = params?.token;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await calendarEventsService.publicGet(token);
        if (!cancelled) setEvent(res.data);
      } catch {
        if (!cancelled) setEvent(null);
        toast.error("Event not found or link invalid");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submitRsvp = async (response) => {
    if (!guestName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setSubmitting(true);
    try {
      await calendarEventsService.publicRsvp(token, {
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim() || null,
        response,
      });
      toast.success("Thanks — you’re on the list");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not save RSVP");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">This event is not available.</p>
      </div>
    );
  }

  if (event.is_cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
            <CardDescription>This event has been cancelled.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-start justify-center">
      <Card className="max-w-lg w-full mt-8">
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {format(new Date(event.starts_at), "PPpp")} – {format(new Date(event.ends_at), "p")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description ? <p className="text-sm whitespace-pre-wrap">{event.description}</p> : null}
          <div className="text-sm space-y-1">
            <p className="capitalize">
              <span className="text-muted-foreground">Format:</span> {event.location_mode}
            </p>
            {event.location_detail_text ? <p>{event.location_detail_text}</p> : null}
            {event.online_meeting_url ? (
              <a href={event.online_meeting_url} className="text-primary underline" target="_blank" rel="noreferrer">
                Online link
              </a>
            ) : null}
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="gname">Your name</Label>
            <Input id="gname" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Required" />
            <Label htmlFor="gemail">Email (optional)</Label>
            <Input id="gemail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" disabled={submitting} onClick={() => submitRsvp("attending")}>
                Attending
              </Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => submitRsvp("maybe")}>
                Maybe
              </Button>
              <Button type="button" variant="ghost" disabled={submitting} onClick={() => submitRsvp("declined")}>
                Can’t attend
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
