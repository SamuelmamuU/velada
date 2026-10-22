"use client";

import React, { useState, useEffect } from "react";
import { MailboxMobileWidget } from "@/components/widgets/MailboxMobileWidget";
import { ICitaResponse } from "@/types";
import { MailboxOverlay } from "@/components/citas/MailboxOverlay";

export default function BuzonWidgetPage() {
  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [showFullMailbox, setShowFullMailbox] = useState(false);

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCitas(data);
        }
      })
      .catch(() => {});
  }, []);

  const pendingCitas = citas.filter((c) => c.estado === "pendiente");

  return (
    <main className="min-h-screen bg-[#0b131d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <MailboxMobileWidget
          pendingCitas={pendingCitas}
          onOpenMailbox={() => setShowFullMailbox(true)}
        />
      </div>

      {showFullMailbox && (
        <MailboxOverlay
          pendingCitas={pendingCitas}
          onClose={() => setShowFullMailbox(false)}
          onCitaUpdated={(updated) => {
            setCitas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />
      )}
    </main>
  );
}
