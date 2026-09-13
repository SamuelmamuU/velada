"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { initializeMobileStatusBar } from "@/lib/mobileNative";

import { NovioDashboard } from "@/components/novio/NovioDashboard";
import { NoviaDashboard } from "@/components/novia/NoviaDashboard";

function DashboardContent() {
  const { user } = useAuth();

  useEffect(() => {
    initializeMobileStatusBar();
  }, []);

  const isNovio = user?.rol === "novio";

  if (isNovio) {
    return <NovioDashboard />;
  }

  return <NoviaDashboard />;
}


export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
