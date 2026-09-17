"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ICitaResponse, IRecuerdoIndependiente } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getTheme } from "@/lib/theme";
import { sendImmediateNotification } from "@/lib/mobileNative";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { Mailbox3DExperience, MailboxStage } from "@/components/mailbox/Mailbox3DExperience";
import { PolaroidMemoriesGallery } from "@/components/citas/PolaroidMemoriesGallery";
import { CoupleAvatarHeader } from "@/components/dashboard/CoupleAvatarHeader";
import { AdventureCalendar } from "@/components/dashboard/AdventureCalendar";
import { NovioForm } from "@/components/novio/NovioForm";
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
  Calendar,
  Camera,
  Plus,
} from "lucide-react";
import { QrPairingModal } from "@/components/pareja/QrPairingModal";

export function NoviaDashboard() {
  const { token, user, pareja } = useAuth();
  const theme = getTheme(
    pareja?.colorDashboardNovia || pareja?.colorDashboardNovio,
    "rosa"
  );
  const partnerName =
    user?.nombrePareja || pareja?.parejaNombre || "tu novio";

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [recuerdos, setRecuerdos] = useState<IRecuerdoIndependiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);
  const [letterInitialSide, setLetterInitialSide] = useState<"letter" | "map" | "memory">("letter");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isWritingLetter, setIsWritingLetter] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendario" | "buzon" | "polaroids">("calendario");

  // Estado del Buzón 3D de Nuestras Aventuras
  const [mailboxStage, setMailboxStage] = useState<MailboxStage>(() => {
    if (typeof window !== "undefined") {
      const auto = sessionStorage.getItem("mailbox_auto_open");
      if (auto === "true") {
        sessionStorage.removeItem("mailbox_auto_open");
        return "door_opening";
      }
    }
    return "minimized_widget";
  });
  const [mailboxOpenTrigger, setMailboxOpenTrigger] = useState(0);
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

  const knownLetterIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetchNoviaRef = useRef(true);

  // Cargar registro de cartas conocidas desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("velada_novia_known_citas");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            knownLetterIdsRef.current = new Set(parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchCitas = useCallback(
    async (isPolling = false) => {
      if (!token) return;
      try {
        if (!isPolling) setLoading(true);
        const res = await fetch("/api/citas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.citas)) {
          let localRecuerdos: Record<string, any> = {};
          try {
            localRecuerdos = JSON.parse(
              localStorage.getItem("velada_recuerdos") || "{}"
            );
          } catch {}

          const fetchedCitas: ICitaResponse[] = data.citas.map(
            (c: ICitaResponse) => {
              if (!c.recuerdo && localRecuerdos[c.id]) {
                return { ...c, recuerdo: localRecuerdos[c.id] };
              }
              if (c.recuerdo) {
                localRecuerdos[c.id] = c.recuerdo;
              }
              return c;
            }
          );

          try {
            localStorage.setItem(
              "velada_recuerdos",
              JSON.stringify(localRecuerdos)
            );
          } catch {}

          setCitas(fetchedCitas);

          // Inicializar cartas conocidas en la primera carga si no había historial
          if (isFirstFetchNoviaRef.current) {
            isFirstFetchNoviaRef.current = false;
            if (knownLetterIdsRef.current.size === 0) {
              fetchedCitas.forEach((c) => knownLetterIdsRef.current.add(c.id));
              try {
                localStorage.setItem(
                  "velada_novia_known_citas",
                  JSON.stringify(Array.from(knownLetterIdsRef.current))
                );
              } catch {}
            }
          }

          // Detectar si han llegado cartas nuevas que no estaban registradas
          const newLetters = fetchedCitas.filter(
            (c) => !knownLetterIdsRef.current.has(c.id)
          );

          if (newLetters.length > 0) {
            newLetters.forEach((c) => knownLetterIdsRef.current.add(c.id));
            try {
              localStorage.setItem(
                "velada_novia_known_citas",
                JSON.stringify(Array.from(knownLetterIdsRef.current))
              );
            } catch {}

            const firstNew = newLetters[0];
            const senderName = partnerName || "Tu novio";
            sendImmediateNotification({
              title: "💌 ¡Tienes una nueva carta en tu buzón!",
              body: `¡${senderName} te ha enviado una hermosa invitación: "${firstNew.nombre}"! Toca para abrir tu buzón.`,
              extra: { citaId: firstNew.id, type: "nueva_carta" },
            });
          }
        }
      } catch (err) {
        console.error("Error al cargar citas de la novia:", err);
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [token, partnerName]
  );

  // Cargar recuerdos independientes
  const fetchRecuerdos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/recuerdos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      let local: IRecuerdoIndependiente[] = [];
      try {
        local = JSON.parse(
          localStorage.getItem("velada_polaroids_libres") || "[]"
        );
      } catch {}

      if (data.success && Array.isArray(data.recuerdos)) {
        const map = new Map<string, IRecuerdoIndependiente>();
        data.recuerdos.forEach((r: IRecuerdoIndependiente) => map.set(r.id, r));
        local.forEach((r: IRecuerdoIndependiente) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setRecuerdos(merged);
      } else if (local.length > 0) {
        setRecuerdos(local);
      }
    } catch (e) {
      console.debug("Error cargando recuerdos:", e);
    }
  }, [token]);

  useEffect(() => {
    fetchCitas();
    fetchRecuerdos();
    const interval = setInterval(() => {
      fetchCitas(true);
      fetchRecuerdos();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCitas, fetchRecuerdos]);

  // Cartas pendientes
  const pendingCitas = citas.filter(
    (c) =>
      c.estado === "pendiente" ||
      (!c.estado && c.propuestaCambio?.estado === "pendiente")
  );

  // Apertura automática si hay cartas pendientes en la primera entrada
  useEffect(() => {
    if (!loading && pendingCitas.length > 0 && !hasShownAutoMailbox) {
      setHasShownAutoMailbox(true);
      setMailboxStage("door_opening");
    }
  }, [loading, pendingCitas.length, hasShownAutoMailbox]);

  // Próximas citas confirmadas
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

  let countdownTitle = "No hay citas confirmadas próximas";
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

  const handleOpenMailbox = () => {
    setMailboxStage("front_closed");
    setMailboxOpenTrigger((prev) => prev + 1);
  };

  return (
    <div className={`min-h-screen text-ink pb-20 bg-gradient-to-b ${theme.bgGradient}`}>
      {/* BUZÓN 3D DE NUESTRAS AVENTURAS */}
      <Mailbox3DExperience
        initialStage={mailboxStage}
        openTrigger={mailboxOpenTrigger}
        pendingCitas={pendingCitas}
        onCitaUpdated={handleCitaUpdated}
        onCloseToDashboard={() => setMailboxStage("minimized_widget")}
      />

      <div className="max-w-[1040px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Cabecera */}
        <AppHeader
          tag={
            selectedCita
              ? "CARTA DE INVITACIÓN"
              : isWritingLetter
              ? "NUEVA CARTA DE AMOR"
              : "CORRESPONDENCIA DE AMOR"
          }
          onBack={
            selectedCita
              ? () => setSelectedCita(null)
              : isWritingLetter
              ? () => setIsWritingLetter(false)
              : undefined
          }
          backLabel="Volver al panel"
        />

        {/* Vista para Escribir una Carta al Novio */}
        {isWritingLetter ? (
          <div className="animate-fade-up">
            <NovioForm
              token={token!}
              onSuccess={(nuevaCita) => {
                setCitas((prev) => [nuevaCita, ...prev]);
                setIsWritingLetter(false);
                setSelectedCita(nuevaCita);
              }}
              onCancel={() => setIsWritingLetter(false)}
            />
          </div>
        ) : selectedCita ? (
          /* Vista de Detalle Individual de la Carta */
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
          /* Vista Principal del Dashboard */
          <div className="space-y-6">
            {/* Visual de Perfil Entrelazado de Ambos con Corazón Superior */}
            <CoupleAvatarHeader theme={theme} />

            {/* Pestañas de Navegación Principal */}
            <div className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl max-w-fit mx-auto sm:mx-0 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("calendario")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "calendario"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Calendar size={15} />
                <span>Calendario de Aventuras</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("buzon")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "buzon"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Mail size={15} />
                <span>Buzón &amp; Cartas</span>
                {pendingCitas.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                    {pendingCitas.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("polaroids")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "polaroids"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Camera size={15} />
                <span>Álbum Polaroid</span>
                {recuerdos.length > 0 && (
                  <span className="text-[10px] opacity-75 font-mono">
                    ({recuerdos.length})
                  </span>
                )}
              </button>
            </div>

            {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
            {activeTab === "calendario" && (
              <div className="space-y-6 animate-fade-up">
                {/* Calendario con citas (denotadas con carta+corazón o polaroid) y polaroids independientes */}
                <AdventureCalendar
                  citas={citas}
                  recuerdos={recuerdos}
                  theme={theme}
                  onSelectCita={(c) => handleSelectCita(c)}
                  onNewCita={() => setIsWritingLetter(true)}
                  onRecuerdoAdded={(nuevo) => {
                    setRecuerdos((prev) => [nuevo, ...prev]);
                  }}
                />

                {/* Recordatorio de Próxima Cita Aceptada */}
                {!loading && proximaCita && (
                  <div className="w-full overflow-hidden bg-white rounded-[22px] border border-sky-200/70 p-4 sm:p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                          <Heart size={22} className="fill-sky-400 text-sky-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10.5px] uppercase tracking-wider text-sky-800 font-bold">
                              Próxima velada confirmada
                            </span>
                            {countdownBadge && (
                              <span className="bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                {countdownBadge}
                              </span>
                            )}
                          </div>
                          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink break-words leading-tight">
                            {proximaCita.nombre}
                          </h2>
                          {proximaCita.descripcion && (
                            <p className="text-xs text-ink-soft mt-1 line-clamp-2 break-words max-w-xl">
                              {proximaCita.descripcion}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs text-ink-soft">
                            <div className="flex items-center gap-1.5 font-medium text-ink shrink-0">
                              <Clock size={14} className="text-sky-700 shrink-0" />
                              <span>
                                {format(
                                  new Date(proximaCita.horario),
                                  "EEE d 'de' MMMM · h:mm a",
                                  { locale: es }
                                )}
                              </span>
                            </div>
                            {proximaCita.lugar?.direccion && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin size={14} className="text-blush-400 shrink-0" />
                                <span className="truncate block">
                                  {proximaCita.lugar.direccion}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectCita(proximaCita)}
                        className="inline-flex items-center justify-center gap-2 bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98] font-semibold text-xs py-3 px-4 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 w-full sm:w-auto"
                      >
                        <span>Ver carta y mapa</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "buzon" && (
              <div className="space-y-6 animate-fade-up">
                {/* Banner de acceso rápido al buzón 3D */}
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
                    onClick={handleOpenMailbox}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={15} />
                    <span>Abrir mi buzón de cartas</span>
                  </button>
                </div>

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
                        ? `Puedes escribirle la primera carta sorpresa a ${partnerName} o esperar su invitación.`
                        : "Para comenzar a compartir cartas de amor y citas en pareja, vincula sus cuentas escaneando el código QR."}
                    </p>

                    <button
                      onClick={() => setIsWritingLetter(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs shadow-sm cursor-pointer transition-all"
                    >
                      <Sparkles size={16} />
                      <span>Escribir carta a {partnerName}</span>
                    </button>
                  </div>
                )}

                {/* Cuadrícula de Cartas */}
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

            {activeTab === "polaroids" && (
              <div className="animate-fade-up">
                <PolaroidMemoriesGallery
                  citas={citas}
                  recuerdos={recuerdos}
                  theme={theme}
                  onSelectMemory={(c) => handleSelectCita(c, "memory")}
                  onRecuerdoAdded={(nuevo) => {
                    setRecuerdos((prev) => [nuevo, ...prev]);
                  }}
                  onRecuerdoDeleted={(id) => {
                    setRecuerdos((prev) => prev.filter((r) => r.id !== id));
                  }}
                  partnerName={partnerName}
                />
              </div>
            )}

            {/* Botón Flotante para Redactar Nueva Carta */}
            <button
              onClick={() => setIsWritingLetter(true)}
              title={`Escribir carta a ${partnerName}`}
              className="fixed right-6 bottom-6 z-40 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm py-3.5 px-5 rounded-full shadow-2xl hover:shadow-[0_16px_30px_-12px_rgba(2,132,199,0.5)] transition-all flex items-center gap-2 cursor-pointer border border-sky-400/40"
            >
              <Plus size={18} />
              <span className="font-sans font-bold">Escribir carta</span>
            </button>
          </div>
        )}
      </div>

      <QrPairingModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
}
