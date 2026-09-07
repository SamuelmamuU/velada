"use client";

import React, { useState } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface CitaDetailViewProps {
  cita: ICitaResponse;
  onBack: () => void;
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
}

export function CitaDetailView({
  cita,
  onBack,
  onCitaUpdated,
}: CitaDetailViewProps) {
  const { user, token } = useAuth();
  const isNovio = user?.rol === "novio";

  const [currentCita, setCurrentCita] = useState<ICitaResponse>(cita);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [respondingProposal, setRespondingProposal] = useState(false);

  // Acción del Novio sobre la propuesta de horario de la novia
  const handleRespondProposal = async (accion: "aceptar" | "rechazar") => {
    if (!token) return;
    setRespondingProposal(true);
    try {
      const res = await fetch(`/api/citas/${currentCita.id}/propuesta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accion }),
      });

      const data = await res.json();
      if (data.success) {
        let updated: ICitaResponse;
        if (accion === "aceptar") {
          updated = {
            ...currentCita,
            horario: data.cita.horario,
            propuestaCambio: {
              ...currentCita.propuestaCambio!,
              estado: "aceptada",
            },
          };
          setFeedbackMsg("Horario actualizado con la propuesta de Diana.");
        } else {
          updated = {
            ...currentCita,
            propuestaCambio: {
              ...currentCita.propuestaCambio!,
              estado: "rechazada",
            },
          };
          setFeedbackMsg("Propuesta declinada; se conserva el horario original.");
        }
        setCurrentCita(updated);
        onCitaUpdated?.(updated);
        setTimeout(() => setFeedbackMsg(null), 5000);
      }
    } catch {
      alert("Error al conectar con el servidor.");
    } finally {
      setRespondingProposal(false);
    }
  };

  const tienePropuestaPendiente =
    currentCita.propuestaCambio &&
    currentCita.propuestaCambio.estado === "pendiente";

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Notificación de feedback */}
      {feedbackMsg && (
        <div className="p-4 bg-sky-50 border border-sky-300 text-sky-900 rounded-2xl text-xs font-sans flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 size={18} className="text-sky-600 flex-shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Banner de propuesta de cambio de horario (Para el Novio) */}
      {isNovio && tienePropuestaPendiente && (
        <div className="bg-gradient-to-r from-sky-100/90 to-blush-50 border border-sky-300/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white flex-shrink-0">
                <CalendarClock size={20} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-ink">
                  ¡Diana ha sugerido un nuevo horario!
                </h4>
                <div className="text-xs text-ink-soft mt-1 space-y-0.5">
                  <div>
                    <span className="font-semibold text-ink">Horario sugerido:</span>{" "}
                    {format(
                      new Date(currentCita.propuestaCambio!.nuevoHorario),
                      "EEEE d 'de' MMMM · h:mm a",
                      { locale: es }
                    )}
                  </div>
                  {currentCita.propuestaCambio?.motivo && (
                    <div className="italic text-ink/80 mt-1">
                      &ldquo;{currentCita.propuestaCambio.motivo}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRespondProposal("aceptar")}
                disabled={respondingProposal}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {respondingProposal ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Aceptar propuesta</span>
                )}
              </button>
              <button
                onClick={() => handleRespondProposal("rechazar")}
                disabled={respondingProposal}
                className="bg-white hover:bg-sky-50 border border-sky-200 text-ink-soft font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors"
              >
                Mantener original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente principal de la carta manuscrita con dog-ear y flip a mapa */}
      <LoveLetterView
        cita={currentCita}
        onClose={onBack}
        onCitaUpdated={(updated) => {
          setCurrentCita(updated);
          onCitaUpdated?.(updated);
        }}
        showCloseButton={true}
      />
    </div>
  );
}
