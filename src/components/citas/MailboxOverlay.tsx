"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse } from "@/types";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { Seal } from "@/components/ui/Seal";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Heart,
  Mail,
} from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (pendingCitas.length === 0) return null;

  const currentCita = pendingCitas[currentIndex] || pendingCitas[0];

  const handleOpenMailbox = () => {
    setIsOpen(true);
  };

  const nextLetter = () => {
    if (currentIndex < pendingCitas.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevLetter = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#132233]/70 backdrop-blur-md animate-fade-up">
      {/* Botón flotante para saltar al dashboard */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white/90 hover:bg-white text-ink-soft hover:text-ink shadow-lg transition-transform hover:scale-105"
        title="Cerrar e ir a mi lista"
      >
        <X size={20} />
      </button>

      <div className="w-full max-w-2xl my-auto">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* ========================================================================= */
            /* PANTALLA 1: EL BUZÓN DE CARTAS CERRADO CON ANIMACIÓN */
            /* ========================================================================= */
            <motion.div
              key="mailbox-closed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center justify-center text-center p-6 sm:p-10"
            >
              {/* Badge superior */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="inline-flex items-center gap-2 bg-white/90 text-sky-900 border border-sky-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm mb-5"
              >
                <Sparkles size={14} className="text-sky-500 animate-pulse" />
                <span>
                  {pendingCitas.length === 1
                    ? "Tienes 1 nueva carta de amor"
                    : `Tienes ${pendingCitas.length} nuevas cartas de amor`}
                </span>
              </motion.div>

              {/* Placa superior con efecto de brochazo / pintura hecha a mano: Samuel y Diana */}
              <div className="relative mb-3 flex flex-col items-center select-none">
                <svg
                  className="absolute -inset-x-6 -inset-y-3 w-[calc(100%+48px)] h-[calc(100%+24px)] text-white/95 drop-shadow-md -z-10"
                  viewBox="0 0 280 60"
                  fill="currentColor"
                  preserveAspectRatio="none"
                >
                  <path d="M 12 18 Q 80 4 140 10 Q 210 5 268 16 Q 275 35 260 48 Q 180 56 120 50 Q 50 55 10 42 Q 4 28 12 18 Z" />
                </svg>

                <div className="px-6 py-1.5 text-center">
                  <span
                    className="font-handwriting text-3xl sm:text-4xl text-sky-950 font-bold tracking-wide block drop-shadow-[0_1px_1px_rgba(40,75,110,0.25)]"
                    style={{
                      transform: "rotate(-1.5deg)",
                      textShadow:
                        "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(100,150,200,0.15)",
                    }}
                  >
                    Samuel & Diana
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-sky-700/80 block mt-0.5">
                    Buzón de Nuestras Aventuras
                  </span>
                </div>
              </div>

              {/* ILUSTRACIÓN INTERACTIVA DEL BUZÓN (3D / Handcrafted) */}
              <div
                onClick={handleOpenMailbox}
                className="group relative cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 duration-300 py-2"
                role="button"
                tabIndex={0}
                aria-label="Abrir puerta del buzón"
              >
                {/* Resplandor suave detrás del buzón */}
                <div className="absolute inset-0 bg-sky-400/20 rounded-full blur-3xl -z-10 group-hover:bg-sky-400/35 transition-all duration-500" />

                {/* SVG Buzón de Correos Romántico */}
                <div className="w-64 sm:w-72 h-64 sm:h-72 mx-auto relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 240 240"
                    className="w-full h-full drop-shadow-[0_20px_25px_rgba(20,40,70,0.35)]"
                  >
                    {/* Poste de madera del buzón */}
                    <rect
                      x="108"
                      y="140"
                      width="24"
                      height="90"
                      rx="4"
                      fill="#8A6B53"
                    />
                    <rect
                      x="112"
                      y="140"
                      width="6"
                      height="90"
                      fill="#6E523D"
                      opacity="0.5"
                    />

                    {/* Soporte horizontal */}
                    <path
                      d="M80 145 L160 145 L150 155 L90 155 Z"
                      fill="#5C4432"
                    />

                    {/* Cuerpo del buzón en azul pastel suave */}
                    <rect
                      x="45"
                      y="50"
                      width="150"
                      height="90"
                      rx="45"
                      fill="#89B8E6"
                    />
                    {/* Sombra y textura del domo del buzón */}
                    <path
                      d="M45 95 C45 70 65 50 90 50 L150 50 C175 50 195 70 195 95 L45 95 Z"
                      fill="#A4C9EE"
                    />

                    {/* Banderín rojo/dorado levantado (Indica correo nuevo) */}
                    <motion.g
                      animate={{ rotate: [-2, 2, -2] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    >
                      <line
                        x1="180"
                        y1="100"
                        x2="210"
                        y2="60"
                        stroke="#D4687C"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M210 60 L230 65 L210 75 Z"
                        fill="#D4687C"
                      />
                    </motion.g>

                    {/* Ranura y marco de la puerta frontal */}
                    <ellipse
                      cx="80"
                      cy="95"
                      rx="30"
                      ry="40"
                      fill="#6B9BC9"
                    />
                    <ellipse
                      cx="80"
                      cy="95"
                      rx="26"
                      ry="36"
                      fill="#4D80AF"
                    />

                    {/* Puerta frontal con pestillo dorado (Eje de apertura) */}
                    <ellipse
                      cx="80"
                      cy="95"
                      rx="24"
                      ry="33"
                      fill="#80AEDD"
                      className="transition-all duration-300 group-hover:brightness-110"
                    />

                    {/* Sello o corazón en la puerta */}
                    <circle cx="80" cy="95" r="9" fill="#E8B568" />
                    <path
                      d="M80 91 C78 88 74 90 75 93 C76 96 80 99 80 99 C80 99 84 96 85 93 C86 90 82 88 80 91 Z"
                      fill="#FFFFFF"
                    />

                    {/* Ranura de cartas superior */}
                    <rect
                      x="95"
                      y="70"
                      width="50"
                      height="4"
                      rx="2"
                      fill="#4D80AF"
                    />

                    {/* Cartas asomándose sutilmente */}
                    <motion.rect
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      x="100"
                      y="66"
                      width="40"
                      height="8"
                      rx="1"
                      fill="#FAF6EE"
                      stroke="#89B8E6"
                    />
                  </svg>
                </div>

                {/* Pulso que invita a tocar */}
                <div className="mt-4 flex flex-col items-center">
                  <div className="bg-white text-sky-950 font-bold text-sm sm:text-base px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2 group-hover:bg-sky-50 transition-colors">
                    <Heart size={16} className="fill-blush-400 text-blush-400 animate-ping" />
                    <span>Toca la puerta del buzón para abrirlo</span>
                  </div>
                  <p className="text-white/80 text-xs mt-2 font-serif italic">
                    «Tu novio ha dejado una carta especial para ti»
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* PANTALLA 2: LAS CARTAS FLOTAN Y SE DESPLIEGA LA INVITACIÓN */
            /* ========================================================================= */
            <motion.div
              key="mailbox-open"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {/* Controles de navegación entre cartas si hay varias */}
              {pendingCitas.length > 1 && (
                <div className="flex items-center justify-between gap-2 mb-3 px-2 bg-white/80 backdrop-blur rounded-2xl p-2 shadow-sm border border-sky-100">
                  <button
                    type="button"
                    onClick={prevLetter}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-sky-900">
                    <Mail size={14} className="text-sky-600" />
                    <span>
                      Carta {currentIndex + 1} de {pendingCitas.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={nextLetter}
                    disabled={currentIndex === pendingCitas.length - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Componente de la carta con sus 2 hojas sobrepuestas y dog-ear */}
              <LoveLetterView
                cita={currentCita}
                onClose={onClose}
                onCitaUpdated={(updated) => {
                  onCitaUpdated(updated);
                  // Si no hay más cartas pendientes, puede cerrar tras responder
                }}
                showCloseButton={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
