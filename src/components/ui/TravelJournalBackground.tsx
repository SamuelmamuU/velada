"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Camera } from "lucide-react";

interface UploadedPolaroidItem {
  src: string;
  caption: string;
  id?: string;
}

const BACKGROUND_SLOTS = [
  {
    className: "top-8 sm:top-12 left-2 sm:left-4 lg:left-6 xl:left-10 rotate-[-6deg] block",
    slotLabel: "Polaroid #1",
  },
  {
    className: "top-8 sm:top-12 right-2 sm:right-4 lg:right-6 xl:right-10 rotate-[6deg] block",
    slotLabel: "Polaroid #2",
  },
  {
    className: "top-[40%] left-1 sm:left-3 lg:left-5 xl:left-8 rotate-[5deg] hidden sm:block",
    slotLabel: "Polaroid #3",
  },
  {
    className: "top-[42%] right-1 sm:right-3 lg:right-5 xl:right-8 rotate-[-5deg] hidden sm:block",
    slotLabel: "Polaroid #4",
  },
  {
    className: "bottom-8 sm:bottom-12 left-2 sm:left-4 lg:left-6 xl:left-10 rotate-[-4deg] hidden sm:block",
    slotLabel: "Polaroid #5",
  },
  {
    className: "bottom-8 sm:bottom-12 right-2 sm:right-4 lg:right-6 xl:right-10 rotate-[7deg] hidden sm:block",
    slotLabel: "Polaroid #6",
  },
];

export function TravelJournalBackground() {
  const { user, pareja, token } = useAuth();
  const novioName = user?.rol === "novio" ? user?.nombre : (user?.nombrePareja || pareja?.parejaNombre || "Novio");
  const noviaName = user?.rol === "novia" ? user?.nombre : (user?.nombrePareja || pareja?.parejaNombre || "Novia");
  const stampText = `${novioName.toUpperCase()} & ${noviaName.toUpperCase()}`;

  const [uploadedPolaroids, setUploadedPolaroids] = useState<UploadedPolaroidItem[]>([]);

  const loadUploadedPolaroids = useCallback(async () => {
    const list: UploadedPolaroidItem[] = [];

    // 1. Cargar desde localStorage para reflejo instantáneo y offline
    try {
      const localLibres = JSON.parse(
        localStorage.getItem("velada_polaroids_libres") || "[]"
      );
      if (Array.isArray(localLibres)) {
        localLibres.forEach((r: any) => {
          if (r?.fotoUrl && !list.some((item) => item.src === r.fotoUrl)) {
            list.push({
              src: r.fotoUrl,
              caption: r.pieDeFoto || "Nuestro Momento",
              id: r.id,
            });
          }
        });
      }

      const localRecuerdosCitas = JSON.parse(
        localStorage.getItem("velada_recuerdos") || "{}"
      );
      if (localRecuerdosCitas && typeof localRecuerdosCitas === "object") {
        Object.values(localRecuerdosCitas).forEach((r: any) => {
          if (r?.fotoUrl && !list.some((item) => item.src === r.fotoUrl)) {
            list.push({
              src: r.fotoUrl,
              caption: r.pieDeFoto || "Nuestra Velada",
            });
          }
        });
      }
    } catch {}

    setUploadedPolaroids([...list].slice(0, 6));

    // 2. Si hay token, sincronizar con base de datos para mostrar fotos subidas por la pareja
    if (token) {
      try {
        const res = await fetch("/api/recuerdos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.recuerdos)) {
          const apiList: UploadedPolaroidItem[] = [];
          data.recuerdos.forEach((r: any) => {
            if (r?.fotoUrl && !apiList.some((item) => item.src === r.fotoUrl)) {
              apiList.push({
                src: r.fotoUrl,
                caption: r.pieDeFoto || "Nuestro Momento",
                id: r.id,
              });
            }
          });

          // Mezclar manteniendo orden
          list.forEach((l) => {
            if (!apiList.some((a) => a.src === l.src)) {
              apiList.push(l);
            }
          });

          setUploadedPolaroids(apiList.slice(0, 6));
        }
      } catch (e) {
        console.debug("Error sincronizando polaroids de fondo:", e);
      }
    }
  }, [token]);

  useEffect(() => {
    loadUploadedPolaroids();
    const handleUpdate = () => loadUploadedPolaroids();
    window.addEventListener("velada_polaroids_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("velada_polaroids_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadUploadedPolaroids]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. ILUSTRACIONES HECHAS A MANO: RUTAS DE VUELO, AVIONES Y MONUMENTOS */}
      <svg
        className="absolute inset-0 w-full h-full text-sky-700/15"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="travel-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.15" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#travel-dots)" />

        {/* Ruta de avión 1: Vuelo ondulado superior */}
        <g stroke="currentColor" fill="none">
          <path
            d="M -50 180 Q 250 80 450 200 T 950 140 T 1450 220"
            strokeWidth="1.6"
            strokeDasharray="6 8"
            opacity="0.8"
          />
          {/* Silueta de avioncito 1 */}
          <g transform="translate(450, 200) rotate(15) scale(0.75)">
            <path
              d="M0 -14 L4 -2 L16 3 L4 5 L2 14 L-2 14 L0 5 L-12 3 L-4 -2 Z"
              fill="currentColor"
              opacity="0.8"
            />
          </g>
        </g>

        {/* Ruta de avión 2: Loop / Bucle de viaje inferior */}
        <g stroke="currentColor" fill="none">
          <path
            d="M 200 800 C 400 650 600 950 800 750 S 1200 600 1500 850"
            strokeWidth="1.6"
            strokeDasharray="6 8"
            opacity="0.6"
          />
          {/* Silueta de avioncito 2 */}
          <g transform="translate(800, 750) rotate(-25) scale(0.75)">
            <path
              d="M0 -14 L4 -2 L16 3 L4 5 L2 14 L-2 14 L0 5 L-12 3 L-4 -2 Z"
              fill="currentColor"
              opacity="0.8"
            />
          </g>
        </g>

        {/* Monumento 1: Torre Eiffel estilizada en trazo de tinta (esquina izquierda superior) */}
        <g
          transform="translate(60, 260) scale(0.65)"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          opacity="0.75"
        >
          {/* Cúspide y aguja */}
          <line x1="60" y1="10" x2="60" y2="40" />
          <circle cx="60" cy="10" r="2" fill="currentColor" />
          <path d="M54 40 L66 40 L64 70 L56 70 Z" />
          {/* Plataforma 1 */}
          <line x1="45" y1="70" x2="75" y2="70" strokeWidth="2" />
          <path d="M50 70 L40 120 L80 120 L70 70" />
          {/* Plataforma 2 */}
          <line x1="30" y1="120" x2="90" y2="120" strokeWidth="2.5" />
          {/* Patas arqueadas */}
          <path d="M40 120 L15 190 M80 120 L105 190" strokeWidth="2" />
          <path d="M32 190 Q 60 145 88 190" strokeWidth="1.8" />
          <line x1="10" y1="190" x2="110" y2="190" strokeWidth="1.5" />
        </g>

        {/* Monumento 2: Coliseo / Arcos clásicos (esquina derecha inferior) */}
        <g
          transform="translate(1050, 520) scale(0.6)"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          opacity="0.65"
        >
          <ellipse cx="100" cy="90" rx="90" ry="25" />
          <ellipse cx="100" cy="50" rx="90" ry="25" />
          <ellipse cx="100" cy="15" rx="80" ry="20" />
          {/* Columnas y arcos */}
          <line x1="15" y1="50" x2="15" y2="90" />
          <line x1="185" y1="50" x2="185" y2="90" />
          <path d="M30 90 C 30 75 45 75 45 90" />
          <path d="M55 90 C 55 75 70 75 70 90" />
          <path d="M80 90 C 80 75 95 75 95 90" />
          <path d="M105 90 C 105 75 120 75 120 90" />
          <path d="M130 90 C 130 75 145 75 145 90" />
          <path d="M155 90 C 155 75 170 75 170 90" />
        </g>

        {/* Brújula / Rosa de los vientos (Centro-derecha) */}
        <g
          transform="translate(880, 80) scale(0.55)"
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          opacity="0.75"
        >
          <circle cx="60" cy="60" r="45" strokeDasharray="3 3" />
          <circle cx="60" cy="60" r="38" />
          {/* Puntas cardinales */}
          <polygon points="60,15 65,55 60,60 55,55" fill="currentColor" />
          <polygon points="60,105 65,65 60,60 55,65" />
          <polygon points="15,60 55,55 60,60 55,65" />
          <polygon points="105,60 65,55 60,60 65,65" fill="currentColor" />
          <text
            x="60"
            y="8"
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            fontFamily="monospace"
          >
            N
          </text>
        </g>

        {/* Sello postal de viaje redondo vintage */}
        <g
          transform="translate(180, 720) scale(0.7)"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        >
          <circle cx="60" cy="60" r="48" />
          <circle cx="60" cy="60" r="44" strokeDasharray="2 3" />
          <text
            x="60"
            y="48"
            textAnchor="middle"
            fontSize="7"
            fontFamily="monospace"
            fill="currentColor"
            letterSpacing="2"
          >
            NUESTRAS AVENTURAS
          </text>
          <line x1="25" y1="58" x2="95" y2="58" strokeWidth="1" />
          <text
            x="60"
            y="70"
            textAnchor="middle"
            fontSize="9"
            fontFamily="serif"
            fontWeight="bold"
            fill="currentColor"
          >
            PASAPORTE
          </text>
          <line x1="25" y1="76" x2="95" y2="76" strokeWidth="1" />
          <text
            x="60"
            y="88"
            textAnchor="middle"
            fontSize="7"
            fontFamily="monospace"
            fill="currentColor"
            letterSpacing="1"
          >
            {stampText}
          </text>
        </g>
      </svg>

      {/* 2. POLAROIDS DISPERSAS CON ESTÉTICA VINTAGE Y WASHI TAPE */}
      {BACKGROUND_SLOTS.map((slot, idx) => {
        const photo = uploadedPolaroids[idx];

        return (
          <div
            key={idx}
            className={`absolute ${slot.className} ${
              photo ? "opacity-75 hover:opacity-100" : "opacity-45 hover:opacity-75"
            } transition-opacity duration-300 drop-shadow-md`}
          >
            {/* Trozo de cinta adhesiva washi tape en la parte superior */}
            <div
              className={`w-10 h-3 mx-auto -mb-1.5 ${
                photo
                  ? "bg-amber-100/90 border-amber-300/50"
                  : "bg-slate-100/80 border-slate-300/40"
              } border shadow-2xs z-10 relative`}
              style={{
                clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
              }}
            />

            {photo ? (
              /* Marco Polaroid con foto subida por la pareja */
              <div className="bg-white p-2 pb-5 rounded-xs border border-sky-100/90 shadow-md">
                <div className="relative overflow-hidden rounded-xs bg-sky-50 aspect-square w-[110px] h-[110px]">
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    className="w-full h-full object-cover sepia-[0.12] contrast-105"
                  />
                </div>
                {/* Pie manuscrito de la foto */}
                <p className="font-handwriting text-[13px] text-sky-950 font-bold text-center mt-1.5 leading-tight tracking-tight line-clamp-1 max-w-[110px]">
                  {photo.caption}
                </p>
              </div>
            ) : (
              /* Marco Polaroid Placeholder esperando foto de la pareja */
              <div className="bg-white/85 backdrop-blur-2xs p-2 pb-5 rounded-xs border border-dashed border-sky-300/70 shadow-xs">
                <div className="relative overflow-hidden rounded-xs bg-sky-50/60 aspect-square w-[110px] h-[110px] flex flex-col items-center justify-center text-sky-400/80">
                  <Camera size={26} className="mb-1 opacity-70" />
                  <span className="text-[9.5px] font-mono text-sky-700/80 font-semibold">
                    {slot.slotLabel}
                  </span>
                </div>
                <p className="font-handwriting text-[12px] text-sky-800/60 font-bold text-center mt-1.5 leading-tight">
                  Sube tu foto
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
