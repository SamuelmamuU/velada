"use client";

import React from "react";
import Image from "next/image";

export function TravelJournalBackground() {
  const polaroids = [
    {
      src: "/polaroids/ANIVERSARIO.jpg",
      caption: "Nuestro Aniversario",
      className: "top-16 -left-8 sm:left-4 rotate-[-7deg] hidden lg:block",
      width: 140,
      height: 140,
    },
    {
      src: "/polaroids/SANTALUCIA.jpg",
      caption: "Paseo Santa Lucía",
      className: "top-32 -right-8 sm:right-6 rotate-[6deg] hidden lg:block",
      width: 140,
      height: 140,
    },
    {
      src: "/polaroids/CABANA.jpg",
      caption: "Nuestra Cabaña",
      className: "bottom-36 -left-6 sm:left-6 rotate-[5deg] hidden xl:block",
      width: 130,
      height: 130,
    },
    {
      src: "/polaroids/ARCADE.jpg",
      caption: "Tarde de juegos",
      className: "bottom-24 -right-6 sm:right-8 rotate-[-5deg] hidden xl:block",
      width: 130,
      height: 130,
    },
    {
      src: "/polaroids/GRADUACION.jpg",
      caption: "Un gran logro",
      className: "top-[48%] -left-10 sm:left-2 rotate-[-4deg] hidden 2xl:block",
      width: 125,
      height: 125,
    },
    {
      src: "/polaroids/VOLUNTARIOS.jpg",
      caption: "Juntos siempre",
      className: "top-[52%] -right-10 sm:right-4 rotate-[7deg] hidden 2xl:block",
      width: 125,
      height: 125,
    },
  ];

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
            SAMUEL & DIANA
          </text>
        </g>
      </svg>

      {/* 2. POLAROIDS DISPERSAS CON ESTÉTICA VINTAGE Y WASHI TAPE */}
      {polaroids.map((item, idx) => (
        <div
          key={idx}
          className={`absolute ${item.className} opacity-30 hover:opacity-85 transition-opacity duration-300 drop-shadow-md`}
        >
          {/* Trozo de cinta adhesiva washi tape en la parte superior */}
          <div
            className="w-10 h-3 mx-auto -mb-1.5 bg-amber-100/80 border border-amber-300/40 shadow-xs z-10 relative"
            style={{
              clipPath:
                "polygon(0 0, 100% 0, 95% 100%, 5% 100%)",
            }}
          />

          {/* Marco Polaroid */}
          <div className="bg-white p-2 pb-5 rounded-xs border border-sky-100/80 shadow-md">
            <div className="relative overflow-hidden rounded-xs bg-sky-50 aspect-square w-[110px] h-[110px]">
              <Image
                src={item.src}
                alt={item.caption}
                fill
                sizes="140px"
                className="object-cover sepia-[0.15] contrast-105"
              />
            </div>
            {/* Pie manuscrito de la foto */}
            <p className="font-handwriting text-[13px] text-sky-950 font-bold text-center mt-1.5 leading-tight tracking-tight">
              {item.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
