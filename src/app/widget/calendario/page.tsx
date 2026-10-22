"use client";

import React, { useState, useEffect } from "react";
import { CalendarMobileWidget } from "@/components/widgets/CalendarMobileWidget";
import { ICitaResponse } from "@/types";
import { LoveLetterView } from "@/components/citas/LoveLetterView";

export default function CalendarioWidgetPage() {
  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);

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

  return (
    <main className="min-h-screen bg-[#0b131d] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <CalendarMobileWidget
          citas={citas}
          onSelectCita={(cita) => setSelectedCita(cita)}
        />
      </div>

      {selectedCita && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg">
            <LoveLetterView
              cita={selectedCita}
              onClose={() => setSelectedCita(null)}
              showCloseButton={true}
            />
          </div>
        </div>
      )}
    </main>
  );
}
