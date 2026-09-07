"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { generateNarrativeLetter } from "@/lib/narrativeLetter";
import { DogEarCorner } from "@/components/citas/DogEarCorner";
import { MapDisplay } from "@/components/maps/MapDisplay";
import { Seal } from "@/components/ui/Seal";
import { generateGoogleCalendarUrl, downloadIcsFile } from "@/lib/calendar";
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
  CheckCircle2,
} from "lucide-react";

interface LoveLetterViewProps {
  cita: ICitaResponse;
  onClose?: () => void;
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  showCloseButton?: boolean;
}

export function LoveLetterView({
  cita,
  onClose,
  onCitaUpdated,
  showCloseButton = true,
}: LoveLetterViewProps) {
  const { user, token } = useAuth();
  const isNovia = user?.rol === "novia";

  const [currentCita, setCurrentCita] = useState<ICitaResponse>(cita);
  const [currentSide, setCurrentSide] = useState<"letter" | "map">("letter");
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

  const narrative = generateNarrativeLetter(currentCita);

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
        setFeedback(
          respuesta === "aceptada"
            ? "¡Invitación aceptada con todo el amor del mundo! 💖"
            : "Has declinado esta invitación con cariño 🤍"
        );
      } else {
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
        setFeedback("Tu sugerencia de horario fue enviada al novio con amor 💌");
      } else {
        setProposalError(data.error || "Error al enviar la sugerencia.");
      }
    } catch {
      setProposalError("Error de conexión al enviar.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const flipPage = () => {
    setCurrentSide((prev) => (prev === "letter" ? "map" : "letter"));
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

  return (
    <div className="relative w-full max-w-[760px] mx-auto perspective-1200 py-4">
      {/* Botón flotante para cerrar vista si aplica */}
      {showCloseButton && onClose && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-ink-soft bg-white/80 hover:bg-sky-100 hover:text-sky-800 border border-sky-200 transition-all shadow-sm"
          >
            <X size={14} />
            <span>Volver a mis cartas</span>
          </button>
        </div>
      )}

      {/* Contenedor principal con efecto 3D flip */}
      <motion.div
        animate={{ rotateY: currentSide === "map" ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.25, 1, 0.5, 1] }}
        className="preserve-3d relative w-full"
      >
        {/* ========================================================================= */}
        {/* HOJA 1: LA CARTA / INVITACIÓN MANUSCRITA */}
        {/* ========================================================================= */}
        <div
          className={`relative w-full bg-[#FCFAF5] rounded-[22px] border border-sky-200/70 p-6 sm:p-10 md:p-12 shadow-letter ${
            currentSide === "map" ? "invisible pointer-events-none" : ""
          }`}
          style={{
            backgroundImage:
              "radial-gradient(rgba(50, 95, 145, 0.035) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
            backgroundSize: "20px 20px, 100% 100%",
          }}
        >
          {/* Esquina doblada (Dog-Ear) hacia el mapa */}
          <DogEarCorner currentSide="letter" onFlip={flipPage} />

          {/* Encabezado postal romántico */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-sky-100/90 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <Seal letter="P" size="lg" variant="gold" />
              <div>
                <div className="font-serif font-bold text-base sm:text-lg text-ink">
                  Planesito de Vida
                </div>
                <div className="text-[11px] font-mono tracking-wider text-sky-700 uppercase">
                  Correspondencia del Corazón · No. {currentCita.id.slice(-4)}
                </div>
              </div>
            </div>

            {/* Matasellos postal simulado */}
            <div className="hidden sm:flex flex-col items-end opacity-70">
              <div className="border border-dashed border-sky-400/60 rounded px-2.5 py-1 text-[10px] font-mono uppercase text-sky-800 tracking-widest text-center">
                ★ ENVIADO CON AMOR ★
                <br />
                <span className="text-[9px] lowercase font-sans">
                  {narrative.fechaTexto}
                </span>
              </div>
            </div>
          </div>

          {/* Estado actual de la invitación */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-sky-600 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-sky-500 hover:text-sky-800"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Insignia si ya fue aceptada o declinada */}
          {!isPending && (
            <div className="mb-6 flex items-center gap-2">
              {isAccepted && (
                <div className="inline-flex items-center gap-2 bg-[#E9F5EB] border border-[#BCE5C2] text-[#2F6D38] px-3.5 py-1 rounded-full text-xs font-semibold shadow-xs">
                  <Heart size={14} className="fill-[#2F6D38]" />
                  <span>Invitación aceptada · Te espera una velada hermosa</span>
                </div>
              )}
              {isRejected && (
                <div className="inline-flex items-center gap-2 bg-[#F3F4F6] border border-[#D1D5DB] text-[#4B5563] px-3.5 py-1 rounded-full text-xs font-semibold shadow-xs">
                  <span>Declinada con cariño · Buscaremos otra ocasión</span>
                </div>
              )}
            </div>
          )}

          {/* CUERPO DE LA CARTA NARRATIVA (Hecho a mano / Manuscrito) */}
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
              <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-block align-baseline mx-1">
                📅 {narrative.fechaTexto}
              </span>{" "}
              a las{" "}
              <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-block align-baseline mx-1">
                ⏰ {narrative.horaTexto}
              </span>
              . Nuestro destino será{" "}
              <span className="font-sans font-semibold text-sm sm:text-base text-sky-900 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200/70 inline-block align-baseline mx-1">
                📍 {narrative.lugarTexto}
              </span>
              . (Recuerda que puedes tocar la esquina doblada arriba para ver el mapa exacto).
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

          {/* ========================================================================= */}
          {/* ACCIONES AL FONDO DE LA CARTA (Para la Novia) */}
          {/* ========================================================================= */}
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
                      <span>¡Sí, acepto ir contigo! 💖</span>
                    </>
                  )}
                </motion.button>

                {/* Botón No: Rechazar */}
                <button
                  type="button"
                  disabled={responding}
                  onClick={() => handleRespond("rechazada")}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-line/80 text-ink-soft hover:text-ink hover:bg-white text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>Esta vez no podré 🤍</span>
                </button>

                {/* Botón Cerrar: Revisar después */}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-xs text-sky-700 hover:text-sky-900 font-medium transition-colors"
                  >
                    <span>Revisar después (guardar en buzón) 📬</span>
                  </button>
                )}
              </div>
            ) : (
              /* Acciones para cita ya respondida o vista del novio */
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleCalendar}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-800 hover:bg-sky-50 transition-colors shadow-xs"
                  >
                    <CalendarPlus size={14} />
                    <span>Google Calendar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-sky-200 text-sky-800 hover:bg-sky-50 transition-colors shadow-xs"
                  >
                    <Download size={14} />
                    <span>{downloadSuccess ? "¡Descargado!" : "Descargar .ICS"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={flipPage}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 transition-colors cursor-pointer"
                >
                  <MapPin size={14} />
                  <span>Ver mapa del lugar 🗺️</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOJA 2: EL MAPA DE LA CITA (Con el mismo Dog-Ear en la misma esquina) */}
        {/* ========================================================================= */}
        <div
          className={`absolute top-0 left-0 w-full bg-[#FCFAF5] rounded-[22px] border border-sky-200/70 p-6 sm:p-10 shadow-letter rotate-y-180 ${
            currentSide === "letter" ? "invisible pointer-events-none" : ""
          }`}
          style={{
            backgroundImage:
              "radial-gradient(rgba(50, 95, 145, 0.035) 1px, transparent 0), linear-gradient(180deg, #FFFFFF 0%, #FAF6EE 100%)",
            backgroundSize: "20px 20px, 100% 100%",
          }}
        >
          {/* Esquina doblada (Dog-Ear) para regresar a la carta */}
          <DogEarCorner currentSide="map" onFlip={flipPage} />

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
              <span>📍 {currentCita.lugar.direccion}</span>
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
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs"
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

            {/* Botón para volver a la carta */}
            <button
              type="button"
              onClick={flipPage}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-sky-800 bg-sky-100 hover:bg-sky-200 transition-all cursor-pointer"
            >
              <span>Voltear a la carta 💌</span>
            </button>
          </div>
        </div>
      </motion.div>

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
                      <span>Enviar sugerencia 💌</span>
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
