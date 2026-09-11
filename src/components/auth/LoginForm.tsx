"use client";

import React from "react";
import { Mailbox3DExperience } from "@/components/mailbox/Mailbox3DExperience";

export function LoginForm() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F9FD] via-[#EDF4FB] to-[#E3EEF8] flex items-center justify-center relative overflow-hidden">
      <Mailbox3DExperience initialStage="lateral_login" isLoginScreen={true} />
    </div>
  );
}
