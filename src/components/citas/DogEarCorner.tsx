"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Camera } from "lucide-react";

interface DogEarCornerProps {
  currentSide: "letter" | "map" | "memory";
  hasMemory?: boolean;
  onFlip: () => void;
  className?: string;
}

export function DogEarCorner({
  currentSide,
  hasMemory = true,
  onFlip,
  className = "",
}: DogEarCornerProps) {
  let label = "Voltear al mapa";
  let Icon = MapPin;

  if (currentSide === "letter") {
    label = "Voltear al mapa";
    Icon = MapPin;
  } else if (currentSide === "map") {
    if (hasMemory) {
      label = "Voltear al recuerdo";
      Icon = Camera;
    } else {
      label = "Voltear a la carta";
      Icon = Mail;
    }
  } else if (currentSide === "memory") {
    label = "Voltear a la carta";
    Icon = Mail;
  }

  return (
    <div
      className={`absolute top-0 right-0 z-30 select-none ${className}`}
      style={{ width: "72px", height: "72px" }}
    >
      <button
        type="button"
        onClick={onFlip}
        aria-label={label}
        title={label}
        className="group relative w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-tr-[18px]"
      >
        {/* Sombra de la esquina levantada */}
        <div
          className="absolute top-0 right-0 w-14 h-14 pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(225deg, rgba(30, 55, 85, 0.22) 0%, rgba(30, 55, 85, 0.08) 50%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />

        {/* Doblez de la hoja (Dog-Ear Flap) */}
        <motion.div
          whileHover={{ scale: 1.08, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          className="absolute top-0 right-0 w-14 h-14 transition-all duration-200"
          style={{
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            background:
              "linear-gradient(135deg, #E6EFF8 0%, #D0E4F5 45%, #B5D4EE 100%)",
            boxShadow: "-3px 4px 10px rgba(35, 65, 95, 0.22)",
            borderBottomLeftRadius: "6px",
          }}
        >
          {/* Pequeño icono en el doblez */}
          <div className="absolute top-2 right-2 text-sky-800 opacity-75 group-hover:opacity-100 transition-opacity">
            <Icon size={14} />
          </div>
        </motion.div>

        {/* Pill flotante indicando la acción */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-1 right-14 sm:right-16 bg-white/95 backdrop-blur border border-sky-200 text-sky-900 text-[11px] font-sans font-medium px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1.5"
        >
          <span>{label}</span>
          <span className="text-[10px] text-sky-600">↪</span>
        </motion.div>
      </button>
    </div>
  );
}
