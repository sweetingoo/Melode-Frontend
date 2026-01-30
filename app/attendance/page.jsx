"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaveRequestList } from "@/components/attendance/LeaveRequestList";
import { HolidayBalanceCard } from "@/components/attendance/HolidayBalanceCard";
import { useAuth } from "@/hooks/useAuth";
import { useAssignments } from "@/hooks/useAssignments";
import { Calendar, Wallet } from "lucide-react";

export default function AttendancePage() {
  const { user } = useAuth();
  const { data: assignmentsData } = useAssignments({ user_id: user?.id, is_active: true });
  const assignments = assignmentsData?.assignments || assignmentsData || [];

  const activeAssignment = assignments?.[0];
  const jobRoleId = activeAssignment?.job_role_id;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Attendance & Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your leave requests and holiday balance
        </p>
      </div>

      <Tabs defaultValue="leave" className="space-y-6">
        <TabsList className="flex h-auto gap-1 rounded-lg bg-muted/50 p-1">
          <TabsTrigger value="leave" className="rounded-md px-4 py-2 data-[state=active]:bg-background">
            <Calendar className="mr-2 h-4 w-4" />
            Leave Requests
          </TabsTrigger>
          <TabsTrigger value="balance" className="rounded-md px-4 py-2 data-[state=active]:bg-background">
            <Wallet className="mr-2 h-4 w-4" />
            Holiday Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Submit and track your leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <LeaveRequestList userId={user?.id} showCreateButton={true} compactHeader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance" className="mt-0">
          {user?.id && jobRoleId ? (
            <div className="grid gap-6 md:grid-cols-2">
              <HolidayBalanceCard userId={user.id} jobRoleId={jobRoleId} />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  No active job role found. Please contact your administrator to assign a role.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
