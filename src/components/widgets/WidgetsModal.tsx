"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, ExternalLink, Mail, Calendar as CalendarIcon } from "lucide-react";
import { ICitaResponse } from "@/types";
import { MailboxMobileWidget } from "./MailboxMobileWidget";
import { CalendarMobileWidget } from "./CalendarMobileWidget";

interface WidgetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCitas: ICitaResponse[];
  allCitas: ICitaResponse[];
  onOpenMailbox: () => void;
  onSelectCita: (cita: ICitaResponse) => void;
}

export function WidgetsModal({
  isOpen,
  onClose,
  pendingCitas,
  allCitas,
  onOpenMailbox,
  onSelectCita,
}: WidgetsModalProps) {
  const [activeTab, setActiveTab] = useState<"buzon" | "calendario">("buzon");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a121c]/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative w-full max-w-md bg-gradient-to-b from-[#18283b] to-[#0f1926] border border-sky-400/30 rounded-3xl p-5 shadow-2xl text-white overflow-hidden"
        >
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          {/* Encabezado */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Smartphone size={17} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-sky-100">Widgets Móviles</h3>
              <p className="text-[11px] text-sky-300/80">Vista previa interactiva para celular</p>
            </div>
          </div>

          {/* Selector de Pestaña */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("buzon")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "buzon"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Mail size={14} />
              <span>Buzón 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("calendario")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "calendario"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <CalendarIcon size={14} />
              <span>Calendario</span>
            </button>
          </div>

          {/* Contenido del Widget Activo */}
          <div className="mb-4">
            {activeTab === "buzon" ? (
              <MailboxMobileWidget
                pendingCitas={pendingCitas}
                onOpenMailbox={() => {
                  onClose();
                  onOpenMailbox();
                }}
              />
            ) : (
              <CalendarMobileWidget
                citas={allCitas}
                onSelectCita={(cita) => {
                  onClose();
                  onSelectCita(cita);
                }}
              />
            )}
          </div>

          {/* Enlace a ruta externa standalone */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-[10px] text-white/50 font-mono">Modo Standalone / Webview:</span>
            <a
              href={activeTab === "buzon" ? "/widget/buzon" : "/widget/calendario"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-white text-[11px] font-bold flex items-center gap-1 underline underline-offset-2"
            >
              <span>Abrir widget en pantalla completa</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
