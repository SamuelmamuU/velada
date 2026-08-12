"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { CitaDetailView } from "@/components/citas/CitaDetailView";
import { differenceInDays, differenceInHours, isFuture, isPast } from "date-fns";
import { Loader2, Heart, Calendar } from "lucide-react";

export function NoviaDashboard() {
  const { token } = useAuth();

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);

  const fetchCitas = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/citas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.citas)) {
        setCitas(data.citas);
      }
    } catch (err) {
      console.error("Error al cargar citas de la novia:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // Encontrar la próxima cita más cercana en el futuro
  const proximasCitas = citas
    .filter(
      (c) =>
        c.estado !== "cancelada" &&
        isFuture(new Date(c.horario))
    )
    .sort(
      (a, b) =>
        new Date(a.horario).getTime() - new Date(b.horario).getTime()
    );

  const proximaCita = proximasCitas[0];

  // Cálculo de cuenta regresiva descriptiva
  let countdownText = "Próximas veladas agendadas";
  if (proximaCita) {
    const d = new Date(proximaCita.horario);
    const dias = differenceInDays(d, new Date());
    const horas = differenceInHours(d, new Date());

    if (dias > 1) {
      countdownText = `Próxima cita en ${dias} días`;
    } else if (dias === 1) {
      countdownText = "Próxima cita mañana";
    } else if (horas > 0) {
      countdownText = `Próxima cita hoy en ${horas} horas`;
    } else {
      countdownText = "¡Tu cita es muy pronto!";
    }
  }

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <div className="max-w-[1040px] mx-auto px-6 py-8 sm:py-12">
        {/* Cabecera de la App */}
        <AppHeader
          tag={selectedCita ? "DETALLE DE LA CITA" : "MIS CITAS"}
          onBack={selectedCita ? () => setSelectedCita(null) : undefined}
          backLabel="Volver a mis citas"
        />

        {/* Vista de Detalle Individual */}
        {selectedCita ? (
          <CitaDetailView
            cita={selectedCita}
            onBack={() => setSelectedCita(null)}
          />
        ) : (
          /* Vista de Lista de Invitaciones */
          <div>
            {/* Encabezado de la Sección de la Novia */}
            <div className="mb-8">
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-gold-deep font-semibold mb-1">
                Te está esperando
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                {countdownText}
              </h1>
              <p className="text-ink-soft text-sm mt-1 font-normal">
                Solo lectura — tu novio se encarga de agendar cada detalle con amor 💛.
              </p>
            </div>

            {/* Estado de Carga */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-line">
                <Loader2 size={32} className="animate-spin text-gold-deep mb-3" />
                <p className="font-serif text-ink-soft text-sm">
                  Cargando tus cartas e invitaciones...
                </p>
              </div>
            )}

            {/* Estado Vacío */}
            {!loading && citas.length === 0 && (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border border-line shadow-card max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-soft flex items-center justify-center text-rose mx-auto mb-4">
                  <Heart size={28} className="fill-rose" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">
                  No hay citas agendadas por ahora
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed">
                  Tu novio está preparando la próxima sorpresa. En cuanto la agende,
                  aparecerá aquí en formato de carta.
                </p>
              </div>
            )}

            {/* Cuadrícula de Invitaciones */}
            {!loading && citas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {citas.map((cita, idx) => (
                  <InviteCard
                    key={cita.id}
                    cita={cita}
                    index={idx}
                    isNovio={false}
                    onSelect={(c) => setSelectedCita(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
