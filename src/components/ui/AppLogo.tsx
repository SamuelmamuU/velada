"use client";

import React from "react";
import Image from "next/image";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

export function AppLogo({
  size = "md",
  className = "",
  showText = false,
}: AppLogoProps) {
  const sizeMap = {
    sm: { width: 36, height: 36, imgClass: "w-9 h-9" },
    md: { width: 48, height: 48, imgClass: "w-12 h-12" },
    lg: { width: 64, height: 64, imgClass: "w-16 h-16" },
    xl: { width: 88, height: 88, imgClass: "w-20 sm:w-24 h-20 sm:h-24" },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex-shrink-0 ${current.imgClass} drop-shadow-sm transition-transform hover:scale-105 select-none`}>
        <Image
          src="/NuestrasAventurasLG.png"
          alt="Nuestras Aventuras"
          width={current.width}
          height={current.height}
          priority
          className="w-full h-full object-contain rounded-full"
        />
      </div>
      {showText && (
        <div>
          <span className="font-serif font-bold text-xl sm:text-2xl text-ink tracking-tight block leading-none">
            Nuestras Aventuras
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-widest text-sky-700 block mt-1">
            Diario y Cartas de Amor
          </span>
        </div>
      )}
    </div>
  );
}
