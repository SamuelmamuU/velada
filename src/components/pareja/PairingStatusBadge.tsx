"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { QrCode, Heart, Link2 } from "lucide-react";
import { QrPairingModal } from "./QrPairingModal";

interface PairingStatusBadgeProps {
  compact?: boolean;
}

export function PairingStatusBadge({ compact = false }: PairingStatusBadgeProps) {
  const { user, pareja } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const isConnected = pareja?.estado === "conectados" || user?.estadoPareja === "conectados";
  const partnerName = pareja?.parejaNombre || user?.nombrePareja || (user?.rol === "novio" ? "Diana" : "Samuel");

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
          isConnected
            ? "bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 border-emerald-200/90 shadow-2xs"
            : "bg-sky-100/70 hover:bg-sky-200/80 text-sky-900 border-sky-300 shadow-2xs animate-pulse"
        }`}
        title={isConnected ? `Conectado con ${partnerName}` : "Vincular con tu pareja mediante Código QR"}
      >
        {isConnected ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <Heart size={12} className="text-blush-500 fill-blush-400 flex-shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
              {compact ? partnerName : `Con ${partnerName}`}
            </span>
          </>
        ) : (
          <>
            <QrCode size={13} className="text-sky-700 flex-shrink-0" />
            <span>Vincular Pareja</span>
          </>
        )}
      </button>

      <QrPairingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
