"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { CitaDetailView } from "@/components/citas/CitaDetailView";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  isFuture,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2,
  Heart,
  Sparkles,
  Bell,
  Clock,
  MapPin,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";

export function NoviaDashboard() {
  const { token } = useAuth();

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);

  // Sistema de invitaciones vistas/no vistas en localStorage
  const [viewedCitaIds, setViewedCitaIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("velada_viewed_citas");
      if (stored) {
        setViewedCitaIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markCitaAsViewed = (citaId: string) => {
    if (!viewedCitaIds.includes(citaId)) {
      const updated = [...viewedCitaIds, citaId];
      setViewedCitaIds(updated);
      try {
        localStorage.setItem(
          "velada_viewed_citas",
          JSON.stringify(updated)
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

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

  // Citas próximas ordenadas
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

  // Identificar citas nuevas (no vistas)
  const nuevasCitas = citas.filter((c) => !viewedCitaIds.includes(c.id));

  // Cuenta regresiva descriptiva
  let countdownTitle = "Próximas veladas agendadas";
  let countdownBadge = "";
  if (proximaCita) {
    const d = new Date(proximaCita.horario);
    const dias = differenceInDays(d, new Date());
    const horas = differenceInHours(d, new Date());
    const minutos = differenceInMinutes(d, new Date());

    if (dias > 1) {
      countdownTitle = `Próxima cita en ${dias} días`;
      countdownBadge = `Faltan ${dias} días`;
    } else if (dias === 1) {
      countdownTitle = "Próxima cita mañana";
      countdownBadge = "¡Mañana!";
    } else if (horas > 0) {
      countdownTitle = `Próxima cita hoy en ${horas} horas`;
      countdownBadge = `En ${horas}h`;
    } else if (minutos > 0) {
      countdownTitle = `¡Tu cita empieza en ${minutos} minutos!`;
      countdownBadge = `En ${minutos}m`;
    } else {
      countdownTitle = "¡Tu cita es hoy!";
      countdownBadge = "¡Hoy!";
    }
  }

  const handleSelectCita = (cita: ICitaResponse) => {
    markCitaAsViewed(cita.id);
    setSelectedCita(cita);
  };

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
          <div className="space-y-8">
            {/* 1. Banner de Notificación de Nuevas Invitaciones (RF-25) */}
            {!loading && nuevasCitas.length > 0 && (
              <div className="bg-gradient-to-r from-gold/15 to-rose-soft/40 border border-gold/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm animate-fade-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold-deep flex-shrink-0">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-serif font-semibold text-sm sm:text-base text-ink">
                      💌 ¡Tienes {nuevasCitas.length}{" "}
                      {nuevasCitas.length === 1
                        ? "nueva invitación!"
                        : "nuevas invitaciones!"}
                    </h4>
                    <p className="text-xs text-ink-soft">
                      Tu novio ha preparado una nueva sorpresa para ti. Toca la
                      tarjeta destacada para abrirla.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Banner de Recordatorio de Cita Próxima (RF-26) */}
            {!loading && proximaCita && (
              <div className="bg-card border border-line rounded-[20px] p-6 shadow-velada animate-fade-up">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-soft flex items-center justify-center text-rose flex-shrink-0">
                      <Bell size={24} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-gold-deep font-semibold">
                          Recordatorio de Velada
                        </span>
                        {countdownBadge && (
                          <span className="bg-gold/20 text-gold-deep font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {countdownBadge}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif text-2xl font-semibold text-ink">
                        {proximaCita.nombre}
                      </h2>
                      <p className="text-xs text-ink-soft mt-1 line-clamp-1 max-w-xl">
                        {proximaCita.descripcion}
                      </p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-ink-soft">
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          <Clock size={14} className="text-gold-deep" />
                          <span>
                            {format(
                              new Date(proximaCita.horario),
                              "EEE d 'de' MMMM · h:mm a",
                              { locale: es }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-rose" />
                          <span className="truncate">
                            {proximaCita.lugar.direccion}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCita(proximaCita)}
                    className="inline-flex items-center gap-2 bg-ink text-white hover:bg-gold-deep font-semibold text-xs py-3 px-4 rounded-xl shadow-sm transition-all"
                  >
                    <span>Ver detalle y mapa</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Encabezado de Sección */}
            <div>
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-gold-deep font-semibold mb-1">
                Te está esperando
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                {countdownTitle}
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
                {citas.map((cita, idx) => {
                  const isNew = !viewedCitaIds.includes(cita.id);
                  return (
                    <InviteCard
                      key={cita.id}
                      cita={cita}
                      index={idx}
                      isNovio={false}
                      isNew={isNew}
                      onSelect={(c) => handleSelectCita(c)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
