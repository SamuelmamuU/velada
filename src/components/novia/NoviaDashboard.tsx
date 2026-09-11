"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { MailboxOverlay } from "@/components/citas/MailboxOverlay";
import { PolaroidMemoriesGallery } from "@/components/citas/PolaroidMemoriesGallery";
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
  Clock,
  MapPin,
  ChevronRight,
  Mail,
  Send,
  QrCode,
} from "lucide-react";
import { QrPairingModal } from "@/components/pareja/QrPairingModal";

export function NoviaDashboard() {
  const { token, user, pareja } = useAuth();

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);
  const [letterInitialSide, setLetterInitialSide] = useState<"letter" | "map" | "memory">("letter");
  const [qrModalOpen, setQrModalOpen] = useState(false);


  // Overlay del buzón de cartas
  const [showMailbox, setShowMailbox] = useState(false);
  const [hasShownAutoMailbox, setHasShownAutoMailbox] = useState(false);

  // Sistema de invitaciones vistas
  const [viewedCitaIds, setViewedCitaIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("nuestras_aventuras_viewed_citas") ||
        localStorage.getItem("planesito_viewed_citas");
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
          "nuestras_aventuras_viewed_citas",
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
      console.error("Error al cargar cartas de la novia:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  // Identificar citas pendientes de respuesta
  const pendingCitas = citas.filter(
    (c) =>
      c.estado === "pendiente" ||
      (!c.estado && c.propuestaCambio?.estado === "pendiente")
  );

  // Abrir buzón automáticamente en la primera carga si hay cartas pendientes sin responder
  useEffect(() => {
    if (!loading && !hasShownAutoMailbox && pendingCitas.length > 0) {
      setShowMailbox(true);
      setHasShownAutoMailbox(true);
    }
  }, [loading, hasShownAutoMailbox, pendingCitas.length]);

  // Citas próximas aceptadas ordenadas cronológicamente
  const proximasCitas = citas
    .filter(
      (c) =>
        (c.estado === "aceptada" || c.estado === "confirmada") &&
        isFuture(new Date(c.horario))
    )
    .sort(
      (a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime()
    );

  const proximaCita = proximasCitas[0];

  // Cuenta regresiva descriptiva
  let countdownTitle = "Tus cartas de amor";
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

  const handleSelectCita = (
    cita: ICitaResponse,
    side: "letter" | "map" | "memory" = "letter"
  ) => {
    markCitaAsViewed(cita.id);
    setLetterInitialSide(side);
    setSelectedCita(cita);
  };

  const handleCitaUpdated = (updated: ICitaResponse) => {
    setCitas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedCita?.id === updated.id) {
      setSelectedCita(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFE] text-ink pb-20">
      {/* OVERLAY DEL BUZÓN DE CARTAS (Pantalla de bienvenida interactiva) */}
      {showMailbox && pendingCitas.length > 0 && (
        <MailboxOverlay
          pendingCitas={pendingCitas}
          onClose={() => setShowMailbox(false)}
          onCitaUpdated={(updated) => {
            handleCitaUpdated(updated);
            // Si ya no quedan pendientes, cerramos el buzón
            if (pendingCitas.length <= 1) {
              setTimeout(() => setShowMailbox(false), 1200);
            }
          }}
        />
      )}

      <div className="max-w-[1040px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Cabecera */}
        <AppHeader
          tag={selectedCita ? "CARTA DE INVITACIÓN" : "CORRESPONDENCIA DE AMOR"}
          onBack={selectedCita ? () => setSelectedCita(null) : undefined}
          backLabel="Volver a todas las cartas"
        />

        {/* Vista de Detalle Individual de la Carta (Mismo componente que en el buzón) */}
        {selectedCita ? (
          <div className="animate-fade-up">
            <LoveLetterView
              cita={selectedCita}
              initialSide={letterInitialSide}
              onClose={() => setSelectedCita(null)}
              onCitaUpdated={handleCitaUpdated}
              showCloseButton={true}
            />
          </div>
        ) : (
          /* Vista del Dashboard con la lista de cartas */
          <div className="space-y-8">
            {/* Banner de acceso rápido al buzón de cartas */}
            <div className="bg-gradient-to-r from-sky-100/90 via-sky-50 to-blush-50 border border-sky-200/80 rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-sky-200/70 text-sky-800 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Mail size={24} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-sky-950">
                    Buzón postal de cartas
                  </h3>
                  <p className="text-xs text-sky-800/80">
                    {pendingCitas.length > 0
                      ? `Tienes ${pendingCitas.length} carta(s) pendiente(s) de respuesta.`
                      : "Todas tus cartas han sido revisadas. Puedes abrir el buzón cuando gustes."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMailbox(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Abrir mi buzón de cartas</span>
              </button>
            </div>

            {/* Recordatorio de Próxima Cita Aceptada */}
            {!loading && proximaCita && (
              <div className="bg-white rounded-[22px] border border-sky-200/70 p-6 shadow-sm animate-fade-up">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 flex-shrink-0">
                      <Heart size={24} className="fill-sky-400 text-sky-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-sky-800 font-bold">
                          Próxima velada confirmada
                        </span>
                        {countdownBadge && (
                          <span className="bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {countdownBadge}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif text-2xl font-bold text-ink">
                        {proximaCita.nombre}
                      </h2>
                      <p className="text-xs text-ink-soft mt-1 line-clamp-1 max-w-xl">
                        {proximaCita.descripcion}
                      </p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-ink-soft">
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          <Clock size={14} className="text-sky-700" />
                          <span>
                            {format(
                              new Date(proximaCita.horario),
                              "EEE d 'de' MMMM · h:mm a",
                              { locale: es }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-blush-400" />
                          <span className="truncate">
                            {proximaCita.lugar.direccion}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectCita(proximaCita)}
                    className="inline-flex items-center gap-2 bg-sky-600 text-white hover:bg-sky-700 font-semibold text-xs py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <span>Ver carta y mapa</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Encabezado de la Sección de Cartas */}
            <div>
              <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-sky-700 font-bold mb-1">
                Correspondencia de amor
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
                {countdownTitle}
              </h1>
              <p className="text-ink-soft text-sm mt-1">
                Toca cualquier carta para abrir su sobre, leer la dedicatoria y voltear la hoja para ver el mapa.
              </p>
            </div>

            {/* Estado de Carga */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-sky-100">
                <Loader2 size={32} className="animate-spin text-sky-600 mb-3" />
                <p className="font-serif text-ink-soft text-sm">
                  Cargando tus cartas de amor...
                </p>
              </div>
            )}

            {/* Estado Vacío */}
            {!loading && citas.length === 0 && (
              <div className="text-center py-16 px-6 bg-white rounded-2xl border border-sky-100 shadow-sm max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-4">
                  <Heart size={28} className="fill-sky-400 text-sky-500" />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2 text-ink">
                  Aún no hay cartas en tu buzón
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed mb-5">
                  {pareja?.estado === "conectados" || user?.estadoPareja === "conectados"
                    ? `${user?.nombrePareja || "Tu novio"} está preparando una nueva sorpresa escrita con todo su corazón. En cuanto la envíe, aparecerá aquí esperándote.`
                    : "Para comenzar a recibir las cartas de amor y citas de tu pareja, vincula sus cuentas escaneando su código QR o compartiéndole el tuyo."}
                </p>

                {pareja?.estado !== "conectados" && user?.estadoPareja !== "conectados" && (
                  <button
                    onClick={() => setQrModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs shadow-sm cursor-pointer transition-all"
                  >
                    <QrCode size={16} />
                    <span>Vincular con mi Pareja por QR</span>
                  </button>
                )}
              </div>
            )}

            {/* Cuadrícula de Invitaciones (Con resplandor para las pendientes) */}
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

            {/* Muro de Recuerdos Polaroid de Nuestras Aventuras */}
            {!loading && citas.length > 0 && (
              <PolaroidMemoriesGallery
                citas={citas}
                onSelectMemory={(c) => handleSelectCita(c, "memory")}
                partnerName={user?.nombrePareja || "Samuel"}
              />
            )}
          </div>
        )}
      </div>

      <QrPairingModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
}

