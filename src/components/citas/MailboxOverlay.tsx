"use client";

import React from "react";
import { ICitaResponse } from "@/types";
import { Mailbox3DExperience } from "@/components/mailbox/Mailbox3DExperience";

interface MailboxOverlayProps {
  pendingCitas: ICitaResponse[];
  onClose: () => void;
  onCitaUpdated: (updated: ICitaResponse) => void;
}

export function MailboxOverlay({
  pendingCitas,
  onClose,
  onCitaUpdated,
}: MailboxOverlayProps) {
  return (
    <Mailbox3DExperience
      initialStage="front_closed"
      pendingCitas={pendingCitas}
      onCitaUpdated={onCitaUpdated}
      onCloseToDashboard={onClose}
    />
  );
}
