"use client";

import React from "react";

interface SealProps {
  letter?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Seal({ letter = "V", size = "md", className = "" }: SealProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-[52px] h-[52px] text-xl",
  };

  return (
    <div
      className={`seal flex items-center justify-center rounded-full font-serif font-semibold select-none ${sizeClasses[size]} ${className}`}
      style={{
        background: "radial-gradient(circle at 32% 28%, #E3B15E, var(--gold-deep) 75%)",
      }}
    >
      {letter}
    </div>
  );
}
