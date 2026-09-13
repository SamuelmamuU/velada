"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { generateNarrativeLetter } from "@/lib/narrativeLetter";
import { DogEarCorner } from "@/components/citas/DogEarCorner";
import { MapDisplay } from "@/components/maps/MapDisplay";
import { AppLogo } from "@/components/ui/AppLogo";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarPlus,
  Download,
  ExternalLink,
  Clock,
  MapPin,
  Sparkles,
  Heart,
  CalendarClock,
  X,
  Loader2,
  Calendar,
  Mail,
  Camera,
  Upload,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  triggerHaptic,
  scheduleCitaReminders,
  openNativeLocation,
} from "@/lib/mobileNative";

interface LoveLetterViewProps {
  cita: ICitaResponse;
  initialSide?: "letter" | "map" | "memory";
  onClose?: () => void;
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  showCloseButton?: boolean;
}

const PRESET_MEMORIES = [
  { url: "/polaroids/ANIVERSARIO.jpg", label: "Aniversario" },
  { url: "/polaroids/SANTALUCIA.jpg", label: "Santa Lucía" },
  { url: "/polaroids/CABANA.jpg", label: "Cabaña" },
  { url: "/polaroids/ARCADE.jpg", label: "Tarde de Arcade" },
  { url: "/polaroids/GRADUACION.jpg", label: "Graduación" },
  { url: "/polaroids/VOLUNTARIOS.jpg", label: "Voluntariado" },
];

export function LoveLetterView({
  cita,
  initialSide = "letter",
  onClose,
  onCitaUpdated,
  showCloseButton = true,
}: LoveLetterViewProps) {
  const { user, token } = useAuth();
  const isNovia = user?.rol === "novia";

  const [currentCita, setCurrentCita] = useState<ICitaResponse>(cita);
  const [currentSide, setCurrentSide] = useState<"letter" | "map" | "memory">(
    initialSide
  );
  const [responding, setResponding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Modal para proponer cambio de horario
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("20:00");
  const [proposedMotivo, setProposedMotivo] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Modal para agregar/editar recuerdo
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryPhotoUrl, setMemoryPhotoUrl] = useState(
    currentCita.recuerdo?.fotoUrl || ""
  );
  const [memoryCaption, setMemoryCaption] = useState(
    currentCita.recuerdo?.pieDeFoto || ""
  );
  const [submittingMemory, setSubmittingMemory] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const narrative = generateNarrativeLetter(currentCita);

  const isDateInPast = isPast(new Date(currentCita.horario));
  const hasMemoryData = Boolean(currentCita.recuerdo?.fotoUrl);
  const hasMemorySheet = true; // Siempre disponible como 3ra pestaña junto con carta y mapa

  const isPending =
    currentCita.estado === "pendiente" ||
    (!currentCita.estado && currentCita.propuestaCambio?.estado === "pendiente");
  const isAccepted =
    currentCita.estado === "aceptada" || currentCita.estado === "confirmada";
  const isRejected = currentCita.estado === "rechazada";

  // Responder a la carta (Aceptar / Rechazar)
  const handleRespond = async (respuesta: "aceptada" | "rechazada") => {
    if (!token) return;
    setResponding(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/citas/${currentCita.id}/responder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ respuesta }),
      });
      const data = await res.json();
      if (data.success && data.cita) {
        setCurrentCita(data.cita);
        onCitaUpdated?.(data.cita);
        if (respuesta === "aceptada") {
          triggerHaptic("success");
          scheduleCitaReminders(data.cita).catch((e) =>
            console.debug("Error programando recordatorio:", e)
          );
        } else {
          triggerHaptic("medium");
        }
        setFeedback(
          respuesta === "aceptada"
            ? "Invitación aceptada con todo el amor del mundo."
            : "Has declinado esta invitación con cariño."
        );
      } else {
        triggerHaptic("warning");
        setFeedback(data.error || "No se pudo actualizar la respuesta.");
      }
    } catch (e) {
      console.error(e);
      setFeedback("Error de conexión al responder.");
    } finally {
      setResponding(false);
    }
  };

  // Enviar contrapropuesta de horario
  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDate || !proposedTime) {
      setProposalError("Por favor selecciona una fecha y hora.");
      return;
    }
    setSubmittingProposal(true);
    setProposalError(null);
    try {
      const combined = new Date(`${proposedDate}T${proposedTime}:00`);
      const res = await fetch(`/api/citas/${currentCita.id}/propuesta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nuevoHorario: combined.toISOString(),
          motivo: proposedMotivo.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.cita) {
        setCurrentCita(data.cita);
        onCitaUpdated?.(data.cita);
        setShowProposalModal(false);
        setFeedback("Tu sugerencia de horario fue enviada al novio con amor.");
      } else {
        setProposalError(data.error || "Error al enviar la sugerencia.");
      }
    } catch {
      setProposalError("Error de conexión al enviar.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  // Guardar foto de recuerdo
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryPhotoUrl) {
      setMemoryError("Por favor selecciona o sube una fotografía para el recuerdo.");
      return;
    }
    setSubmittingMemory(true);
    setMemoryError(null);
    try {
      const res = await fetch(`/api/citas/${currentCita.id}/recuerdo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fotoUrl: memoryPhotoUrl,
          pieDeFoto: memoryCaption.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.cita) {
        setCurrentCita(data.cita);
        onCitaUpdated?.(data.cita);
        setShowMemoryModal(false);
        setFeedback("Fotografía de recuerdo agregada con éxito.");
        setCurrentSide("memory");
      } else {
        setMemoryError(data.error || "Error al guardar el recuerdo.");
      }
    } catch {
      setMemoryError("Error de conexión al guardar el recuerdo.");
    } finally {
      setSubmittingMemory(false);
    }
  };

  // Carga de archivo local a Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setMemoryError("La imagen no debe superar los 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMemoryPhotoUrl(reader.result);
        setMemoryError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Ciclo entre las 3 hojas: carta -> mapa -> foto polaroid -> carta
  const cyclePage = () => {
    if (currentSide === "letter") {
      setCurrentSide("map");
    } else if (currentSide === "map") {
      setCurrentSide("memory");
    } else {
      setCurrentSide("letter");
    }
  };

  const handleDownloadIcs = () => {
    downloadIcsFile(currentCita);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(currentCita);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentCita.lugar.lat},${currentCita.lugar.lng}`;

  let formattedMemoryDate = "";
  try {
    const memDate = currentCita.recuerdo?.fechaSubida
      ? new Date(currentCita.recuerdo.fechaSubida)
      : new Date(currentCita.horario);
    formattedMemoryDate = format(memDate, "EEEE d 'de' MMMM, yyyy", {
      locale: es,
    });
  } catch {
    formattedMemoryDate = "";
  }

  return (
    <div className="relative w-full max-w-[760px] mx-auto py-4">
      {/* Barra superior de navegación y cierre */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        {/* Pestañas de hojas sobrepuestas */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur p-1 rounded-2xl border border-sky-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setCurrentSide("letter")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentSide === "letter"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-ink-soft hover:text-sky-900 hover:bg-sky-50"
            }`}
          >
            <Mail size={13} />
            <span>1. Carta</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSide("map")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentSide === "map"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-ink-soft hover:text-sky-900 hover:bg-sky-50"
            }`}
          >
            <MapPin size={13} />
            <span>2. Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSide("memory")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentSide === "memory"
                ? "bg-sky-600 text-white shadow-xs"
                : "text-ink-soft hover:text-sky-900 hover:bg-sky-50"
            }`}
          >
            <Camera size={13} />
            <span>3. Foto Polaroid</span>
            {hasMemoryData && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>
        </div>

        {/* Botón Volver / Cerrar */}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-ink-soft bg-white/90 hover:bg-sky-100 hover:text-sky-900 border border-sky-200 transition-all shadow-xs"
          >
            <X size={14} />
            <span>Volver al buzón</span>
          </button>
        )}
      </div>

      {/* Contenedor animado para el cambio entre hojas */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* HOJA 1: LA CARTA / INVITACIÓN MANUSCRITA */}
        {/* ========================================================================= */}
        {currentSide === "letter" && (
          <motion.div
            key="sheet-letter"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="relative w-full bg-[#FCFAF5] rounded-[22px] border border-sky-200/70 p-6 sm:p-10 md:p-12 shadow-letter"
            style={{
              backgroundImage:
                "radial-gradient(rgba(50, 95, 145, 0.035) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
              backgroundSize: "20px 20px, 100% 100%",
            }}
          >
            {/* Esquina doblada (Dog-Ear) hacia la siguiente hoja */}
            <DogEarCorner
              currentSide="letter"
              hasMemory={hasMemorySheet}
              onFlip={cyclePage}
            />

            {/* Encabezado postal romántico con AppLogo */}
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-sky-100/90 mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <AppLogo size="md" />
                <div>
                  <div className="font-serif font-bold text-base sm:text-lg text-ink">
                    Nuestras Aventuras
                  </div>
                  <div className="text-[11px] font-mono tracking-wider text-sky-700 uppercase">
                    Correspondencia del Corazón · No. {currentCita.id.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Matasellos postal simulado */}
              <div className="hidden sm:flex flex-col items-end opacity-70">
                <div className="border border-dashed border-sky-400/60 rounded px-2.5 py-1 text-[10px] font-mono uppercase text-sky-800 tracking-widest text-center">
                  ENVIADO CON AMOR
                  <br />
                  <span className="text-[9px] lowercase font-sans">
                    {narrative.fechaTexto}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensaje de retroalimentación temporal */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-sky-600 flex-shrink-0" />
                  <span>{feedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-sky-500 hover:text-sky-800"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}

            {/* Insignia si ya fue aceptada o declinada */}
            {!isPending && (
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                {isAccepted && (
                  <div className="inline-flex items-center gap-2 bg-[#E9F5EB] border border-[#BCE5C2] text-[#2F6D38] px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
                    <Heart size={14} className="fill-[#2F6D38]" />
                    <span>Invitación aceptada · Te espera una velada hermosa</span>
                  </div>
                )}
                {isRejected && (
                  <div className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#D1D5DB] text-[#4B5563] px-3.5 py-1 rounded-full text-xs font-semibold shadow-2xs">
                    <span>Declinada con cariño · Buscaremos otra ocasión</span>
                  </div>
                )}

                {/* Botón de Agregar Recuerdo si la fecha ya pasó */}
                {isDateInPast && (
                  <button
                    type="button"
                    onClick={() => setShowMemoryModal(true)}
                    className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300/80 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Camera size={13} className="text-sky-700" />
                    <span>
                      {hasMemoryData ? "Modificar recuerdo" : "Agregar recuerdo"}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* CUERPO DE LA CARTA NARRATIVA (Hecho a mano / Manuscrito sin emojis) */}
            <article className="space-y-5 sm:space-y-6 text-ink/90">
              {/* Saludo */}
              <p className="font-handwriting text-2xl sm:text-3xl text-sky-950 leading-relaxed font-bold">
                {narrative.saludo}
              </p>

              {/* Párrafo 1: La sorpresa */}
              <p className="font-handwriting text-xl sm:text-2xl leading-relaxed sm:leading-loose text-ink">
                {narrative.introduccion} {narrative.descripcion}
              </p>

              {/* Párrafo 2: Fecha y Lugar narrados con legibilidad destacada */}
              <p className="font-handwriting text-xl sm:text-2xl leading-relaxed sm:leading-loose text-ink">
                He reservado el tiempo para nosotros: te espero el{" "}
                <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-flex items-center gap-1 align-baseline mx-1">
                  <Calendar size={13} className="text-sky-700" />
                  <span>{narrative.fechaTexto}</span>
                </span>{" "}
                a las{" "}
                <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-flex items-center gap-1 align-baseline mx-1">
                  <Clock size={13} className="text-sky-700" />
                  <span>{narrative.horaTexto}</span>
                </span>
                . Nuestro destino será{" "}
                <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-flex items-center gap-1 align-baseline mx-1">
                  <MapPin size={13} className="text-sky-700" />
                  <span>{narrative.lugarTexto}</span>
                </span>
                . (Recuerda que puedes tocar la pestaña o esquina doblada arriba para ver el mapa exacto).
              </p>

              {/* Párrafo 3: Compañía y ambiente */}
              <p className="font-handwriting text-xl sm:text-2xl leading-relaxed sm:leading-loose text-ink">
                {narrative.companiaTexto} {narrative.ambienteTexto}
              </p>

              {/* Párrafo 4: Vestimenta recomendada */}
              <p className="font-handwriting text-xl sm:text-2xl leading-relaxed sm:leading-loose text-ink">
                {narrative.vestimentaTexto}
              </p>

              {/* Párrafo 5: Cierre */}
              <p className="font-handwriting text-xl sm:text-2xl leading-relaxed sm:leading-loose text-sky-900 font-semibold pt-2">
                {narrative.cierre}
              </p>

              {/* Firma */}
              <div className="pt-4 text-right">
                <p className="font-handwriting text-2xl sm:text-3xl text-sky-800 font-bold">
                  {narrative.firma}
                </p>
              </div>

              {/* Posdata / Ajuste de horario */}
              {narrative.posdata && (
                <div className="pt-4 border-t border-sky-100">
                  <p className="font-handwriting text-lg sm:text-xl text-ink-soft italic">
                    {narrative.posdata}
                  </p>
                  {isNovia && isPending && (
                    <button
                      type="button"
                      onClick={() => setShowProposalModal(true)}
                      className="mt-2 text-xs font-sans font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-4 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CalendarClock size={14} />
                      <span>¿Prefieres sugerir otra hora o día? Toca aquí</span>
                    </button>
                  )}
                </div>
              )}
            </article>

            {/* ACCIONES AL FONDO DE LA CARTA */}
            <div className="mt-10 pt-6 border-t border-sky-200/60">
              {isNovia && isPending ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Botón Sí: Aceptar */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={responding}
                    onClick={() => handleRespond("aceptada")}
                    className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-sans font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {responding ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Heart size={18} className="fill-white" />
                        <span>Acepto ir contigo</span>
                      </>
                    )}
                  </motion.button>

                  {/* Botón No: Rechazar */}
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() => handleRespond("rechazada")}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-sky-200/80 text-ink-soft hover:text-ink hover:bg-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    <span>Esta vez no podré</span>
                  </button>

                  {/* Botón Cerrar: Guardar en buzón */}
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs text-sky-700 hover:text-sky-900 font-medium transition-colors inline-flex items-center gap-1.5 justify-center"
                    >
                      <Mail size={14} />
                      <span>Revisar después (guardar en buzón)</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Acciones para cita ya respondida o vista del novio */
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleGoogleCalendar}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-800 hover:bg-sky-50 transition-colors shadow-2xs"
                    >
                      <CalendarPlus size={14} />
                      <span>Google Calendar</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadIcs}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-800 hover:bg-sky-50 transition-colors shadow-2xs"
                    >
                      <Download size={14} />
                      <span>
                        {downloadSuccess ? "Descargado" : "Descargar .ICS"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSide("memory");
                        if (!hasMemoryData) setShowMemoryModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Camera size={14} className="text-sky-700" />
                      <span>
                        {hasMemoryData ? "Ver Foto Polaroid" : "Agregar Foto Polaroid"}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentSide("map")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 transition-colors cursor-pointer"
                  >
                    <MapPin size={14} />
                    <span>Ver mapa del lugar</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* HOJA 2: EL MAPA DE LA CITA */}
        {/* ========================================================================= */}
        {currentSide === "map" && (
          <motion.div
            key="sheet-map"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="relative w-full bg-[#FCFAF5] rounded-[22px] border border-sky-200/70 p-6 sm:p-10 shadow-letter"
            style={{
              backgroundImage:
                "radial-gradient(rgba(50, 95, 145, 0.035) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
              backgroundSize: "20px 20px, 100% 100%",
            }}
          >
            {/* Esquina doblada (Dog-Ear) */}
            <DogEarCorner
              currentSide="map"
              hasMemory={hasMemorySheet}
              onFlip={cyclePage}
            />

            {/* Encabezado del mapa */}
            <div className="pb-4 border-b border-sky-100 mb-6">
              <div className="flex items-center gap-2 text-sky-700 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                <MapPin size={14} />
                <span>Hoja de Ubicación · {currentCita.tematica}</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                {currentCita.nombre}
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft mt-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-sky-600 flex-shrink-0" />
                <span>{currentCita.lugar.direccion}</span>
              </p>
            </div>

            {/* Mapa interactivo */}
            <div className="rounded-2xl overflow-hidden border border-sky-200 shadow-sm mb-5 bg-sky-50">
              <MapDisplay
                lugar={currentCita.lugar}
                nombre={currentCita.nombre}
              />
            </div>

            {/* Botones y acciones del mapa */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-sky-100">
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-2xs"
                >
                  <ExternalLink size={15} />
                  <span>Abrir en Google Maps</span>
                </a>

                <button
                  type="button"
                  onClick={handleGoogleCalendar}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-white border border-sky-200 text-sky-900 hover:bg-sky-50 transition-colors"
                >
                  <CalendarPlus size={14} />
                  <span>Agendar en Calendario</span>
                </button>
              </div>

              {/* Botones para avanzar a la foto polaroid o volver a la carta */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentSide("letter")}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-ink-soft hover:text-ink hover:bg-paper transition-all cursor-pointer"
                >
                  <Mail size={14} />
                  <span>Voltear a la carta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentSide("memory")}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300/80 transition-all shadow-2xs cursor-pointer"
                >
                  <Camera size={15} className="text-sky-700" />
                  <span>
                    {hasMemoryData ? "Ver Foto Polaroid" : "Agregar Foto Polaroid"}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* HOJA 3: EL RECUERDO / POLAROID POST-CITA */}
        {/* ========================================================================= */}
        {currentSide === "memory" && (
          <motion.div
            key="sheet-memory"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="relative w-full bg-[#FCFAF5] rounded-[22px] border border-sky-200/70 p-6 sm:p-10 shadow-letter"
            style={{
              backgroundImage:
                "radial-gradient(rgba(50, 95, 145, 0.035) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
              backgroundSize: "20px 20px, 100% 100%",
            }}
          >
            {/* Esquina doblada (Dog-Ear) para regresar a la carta */}
            <DogEarCorner
              currentSide="memory"
              hasMemory={true}
              onFlip={cyclePage}
            />

            {/* Encabezado de la hoja de recuerdo */}
            <div className="pb-4 border-b border-sky-100 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sky-700 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                  <Camera size={14} />
                  <span>Hoja de Recuerdos · Nuestras Aventuras</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  {currentCita.nombre}
                </h3>
                {formattedMemoryDate && (
                  <p className="text-xs text-ink-soft mt-1">
                    {formattedMemoryDate}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMemoryModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition-colors shadow-2xs cursor-pointer"
              >
                <Camera size={13} />
                <span>
                  {hasMemoryData ? "Cambiar foto" : "Agregar foto"}
                </span>
              </button>
            </div>

            {/* CUERPO DEL RECUERDO: FOTO POLAROID ARTESANAL */}
            <div className="py-4 flex flex-col items-center justify-center">
              {hasMemoryData ? (
                <div className="relative group max-w-sm sm:max-w-md w-full">
                  {/* Washi tape superior simulada */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#E8D9C5]/85 border-t border-b border-dashed border-[#B89B7A]/40 shadow-xs -rotate-2 z-20 pointer-events-none rounded-xs" />

                  {/* Marco Polaroid con inclinación y sombra suave */}
                  <div
                    className="relative bg-white p-4 pb-7 rounded-[4px] border border-[#E7DEC8] shadow-[0_16px_35px_rgba(20,40,70,0.16)] transform -rotate-1 group-hover:rotate-0 transition-transform duration-300 ease-out"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%)",
                    }}
                  >
                    {/* Contenedor de la foto con efecto de revelado fotográfico */}
                    <div className="relative aspect-[4/3] w-full bg-[#EAE3D2] overflow-hidden rounded-[2px] border border-black/5">
                      <img
                        src={currentCita.recuerdo?.fotoUrl}
                        alt={`Recuerdo de ${currentCita.nombre}`}
                        className="w-full h-full object-cover filter saturate-[0.98] contrast-[1.02] transition-all duration-500 group-hover:scale-[1.02]"
                      />
                    </div>

                    {/* Pie de foto manuscrito en el margen inferior de la Polaroid */}
                    <div className="mt-4 px-2 text-center">
                      <p className="font-handwriting text-2xl sm:text-3xl text-sky-950 font-bold leading-relaxed">
                        {currentCita.recuerdo?.pieDeFoto ||
                          "Un momento inolvidable de nuestras aventuras."}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700/80 mt-1">
                        Diana & Samuel · Guardado con amor
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Marco Polaroid en blanco esperando la foto */
                <div className="relative group max-w-sm sm:max-w-md w-full my-2">
                  {/* Washi tape superior decorativo */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#E8D9C5]/85 border-t border-b border-dashed border-[#B89B7A]/40 shadow-xs -rotate-2 z-20 pointer-events-none rounded-xs" />

                  {/* Marco Polaroid con inclinación artesanal */}
                  <div
                    className="relative bg-white p-4 pb-7 rounded-[4px] border border-[#E7DEC8] shadow-[0_16px_35px_rgba(20,40,70,0.16)] transform -rotate-1 group-hover:rotate-0 transition-transform duration-300 ease-out"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%)",
                    }}
                  >
                    {/* Espacio para la foto con aspecto de canvas listo para ser revelado */}
                    <div
                      onClick={() => setShowMemoryModal(true)}
                      className="relative aspect-[4/3] w-full bg-gradient-to-b from-sky-50/70 to-[#FAF6EE] border-2 border-dashed border-sky-300/80 rounded-[2px] flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-sky-100/60 hover:border-sky-500 transition-all group/canvas"
                    >
                      <div className="w-14 h-14 rounded-full bg-white border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs mb-3 group-hover/canvas:scale-110 group-hover/canvas:bg-sky-600 group-hover/canvas:text-white transition-all">
                        <Camera size={26} />
                      </div>
                      <h4 className="font-serif text-base sm:text-lg font-bold text-sky-950 mb-1">
                        Inmortaliza esta aventura
                      </h4>
                      <p className="text-[11px] text-ink-soft max-w-xs mb-4 leading-relaxed">
                        Al acabar la cita, sube aquí tu foto tipo Polaroid con una dedicatoria escrita a mano para guardarla en el diario de recuerdos.
                      </p>
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors">
                        <Camera size={14} />
                        <span>Agregar foto Polaroid</span>
                      </span>
                    </div>

                    {/* Pie de foto manuscrito en espera */}
                    <div className="mt-4 px-2 text-center">
                      <p className="font-handwriting text-xl sm:text-2xl text-sky-950/40 italic">
                        &ldquo;Tu frase o dedicatoria escrita a mano aparecerá aquí...&rdquo;
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700/60 mt-1">
                        Diana & Samuel · Álbum de Nuestras Aventuras
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pie de la hoja de recuerdo */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-sky-100 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => setShowMemoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 transition-colors shadow-2xs cursor-pointer"
              >
                <Camera size={13} />
                <span>
                  {hasMemoryData ? "Cambiar foto Polaroid" : "Subir foto Polaroid"}
                </span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setCurrentSide("map")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-ink-soft hover:text-ink hover:bg-paper transition-all cursor-pointer"
                >
                  <MapPin size={14} />
                  <span>Ver mapa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSide("letter")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 transition-all cursor-pointer"
                >
                  <Mail size={15} />
                  <span>Voltear a la carta</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL PARA AGREGAR / EDITAR RECUERDO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showMemoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-sky-100 my-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sky-800 font-serif font-bold text-lg">
                  <Camera size={20} />
                  <span>Foto de Recuerdo · Polaroid</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMemoryModal(false)}
                  className="p-1 rounded-full text-ink-soft hover:bg-sky-50"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-ink-soft mb-4 leading-relaxed">
                Selecciona una foto desde tu dispositivo o elige una de nuestras fotografías favoritas para guardar en el sobre de esta cita.
              </p>

              {memoryError && (
                <div className="mb-4 p-2.5 rounded-xl bg-blush-50 text-blush-900 text-xs border border-blush-200">
                  {memoryError}
                </div>
              )}

              <form onSubmit={handleSaveMemory} className="space-y-4 text-xs">
                {/* Opción 1: Subir desde dispositivo */}
                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1.5 text-[11px]">
                    Subir foto desde tu dispositivo
                  </label>
                  <label className="w-full border-2 border-dashed border-sky-200 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-sky-50/50 hover:border-sky-300 transition-colors">
                    <Upload size={20} className="text-sky-600" />
                    <span className="font-sans font-semibold text-xs text-sky-800">
                      Toca para explorar imágenes
                    </span>
                    <span className="text-[10.5px] text-ink-soft font-normal">
                      PNG, JPG o WEBP (máx. 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Opción 2: Fotos sugeridas de nuestro diario */}
                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1.5 text-[11px]">
                    O elige de nuestras fotos favoritas
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_MEMORIES.map((preset) => {
                      const isSelected = memoryPhotoUrl === preset.url;
                      return (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setMemoryPhotoUrl(preset.url);
                            setMemoryError(null);
                          }}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-sky-600 ring-2 ring-sky-300"
                              : "border-sky-200 hover:border-sky-400 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-sky-600/30 flex items-center justify-center">
                              <div className="w-5 h-5 rounded-full bg-white text-sky-800 flex items-center justify-center shadow-xs">
                                <Check size={12} />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vista previa miniatura si hay foto seleccionada */}
                {memoryPhotoUrl && (
                  <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-white shadow-xs flex-shrink-0 bg-white">
                      <img
                        src={memoryPhotoUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sky-950 truncate text-[11.5px]">
                        Foto seleccionada
                      </div>
                      <div className="text-[10.5px] text-ink-soft truncate">
                        Lista para guardar en el diario polaroid
                      </div>
                    </div>
                  </div>
                )}

                {/* Pie de foto / Mensaje manuscrito */}
                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1 text-[11px]">
                    Pie de foto (mensaje manuscrito)
                  </label>
                  <textarea
                    rows={2}
                    value={memoryCaption}
                    onChange={(e) => setMemoryCaption(e.target.value)}
                    placeholder="Ej. 'Un día inolvidable bajo las estrellas, te amo infinito.'"
                    className="w-full p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 text-ink focus:outline-none focus:ring-2 focus:ring-sky-400 font-sans"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-100">
                  <button
                    type="button"
                    onClick={() => setShowMemoryModal(false)}
                    className="px-4 py-2 rounded-xl text-ink-soft hover:bg-sky-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingMemory}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingMemory ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <Camera size={14} />
                        <span>Guardar Recuerdo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL PARA PROPUESTA DE CAMBIO DE HORARIO */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showProposalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-sky-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sky-800 font-serif font-bold text-lg">
                  <CalendarClock size={20} />
                  <span>Sugerir otro horario con amor</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProposalModal(false)}
                  className="p-1 rounded-full text-ink-soft hover:bg-sky-50"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-ink-soft mb-4 leading-relaxed">
                Tu novio recibirá tu sugerencia con mucho cariño y podrá actualizar la cita para que ambos estén cómodos.
              </p>

              {proposalError && (
                <div className="mb-4 p-2.5 rounded-xl bg-blush-50 text-blush-900 text-xs border border-blush-200">
                  {proposalError}
                </div>
              )}

              <form onSubmit={handleSendProposal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1 text-[11px]">
                    Fecha propuesta
                  </label>
                  <input
                    type="date"
                    required
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1 text-[11px]">
                    Hora propuesta
                  </label>
                  <input
                    type="time"
                    required
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase text-ink-soft mb-1 text-[11px]">
                    Mensaje o motivo (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={proposedMotivo}
                    onChange={(e) => setProposedMotivo(e.target.value)}
                    placeholder="Ej. 'Ese día salgo un poquito tarde del trabajo, ¿te parece a las 8:30?'"
                    className="w-full p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 text-ink focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(false)}
                    className="px-4 py-2 rounded-xl text-ink-soft hover:bg-sky-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProposal}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    {submittingProposal ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Enviar sugerencia</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

