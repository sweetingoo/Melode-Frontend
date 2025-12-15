"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfigurePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Configuration page
    router.replace("/admin/configuration");
  }, [router]);

  return null;
}
