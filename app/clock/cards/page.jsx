"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClockCardsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/cards");
  }, [router]);
  return null;
}
