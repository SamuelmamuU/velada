"use client";

import React from "react";

interface SealProps {
  letter?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "blue" | "gold" | "rose";
  className?: string;
}

export function Seal({
  letter = "P",
  size = "md",
  variant = "blue",
  className = "",
}: SealProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-14 h-14 text-lg",
  };

  const variantGradients = {
    blue: "radial-gradient(circle at 32% 28%, #85BAE6, #36658C 85%)",
    gold: "radial-gradient(circle at 32% 28%, #F2C97E, #996F2E 85%)",
    rose: "radial-gradient(circle at 32% 28%, #F5A3B3, #B85268 85%)",
  };

  const shadowClasses = {
    blue: "shadow-[0_6px_16px_-4px_rgba(54,101,140,0.5),inset_0_0_0_2px_rgba(255,255,255,0.3)]",
    gold: "shadow-[0_6px_16px_-4px_rgba(153,111,46,0.5),inset_0_0_0_2px_rgba(255,255,255,0.3)]",
    rose: "shadow-[0_6px_16px_-4px_rgba(184,82,104,0.5),inset_0_0_0_2px_rgba(255,255,255,0.3)]",
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full font-serif font-bold text-white select-none transition-transform hover:scale-105 active:scale-95 flex-shrink-0 ${sizeClasses[size]} ${shadowClasses[variant]} ${className}`}
      style={{
        background: variantGradients[variant],
      }}
    >
      <div className="absolute inset-[-3px] rounded-full border border-dashed border-white/40 pointer-events-none" />
      <span className="relative z-10 drop-shadow-sm">{letter}</span>
    </div>
  );
}
