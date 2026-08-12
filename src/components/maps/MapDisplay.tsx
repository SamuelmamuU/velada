"use client";

import React, { useEffect, useState } from "react";
import { ILugar } from "@/types";
import { ExternalLink } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapDisplayProps {
  lugar: ILugar;
  nombre: string;
}

function LeafletDisplayInner({ lugar, nombre }: MapDisplayProps) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const mapContainer = document.getElementById("leaflet-display-container");
    if (!mapContainer) return;

    const customIcon = L.divIcon({
      className: "custom-velada-pin-display",
      html: `
        <div style="transform: translate(-50%, -100%);">
          <svg width="34" height="44" viewBox="0 0 26 34" fill="none">
            <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="#B85C6B" filter="drop-shadow(0 6px 8px rgba(43,36,56,0.35))"/>
            <circle cx="13" cy="13" r="5" fill="#FAF6F0"/>
          </svg>
        </div>
      `,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
    });

    const mapInstance = L.map("leaflet-display-container", {
      scrollWheelZoom: false,
    }).setView([lugar.lat, lugar.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance);

    const marker = L.marker([lugar.lat, lugar.lng], { icon: customIcon }).addTo(
      mapInstance
    );

    marker.bindPopup(`<strong>${nombre}</strong><br/>${lugar.direccion}`);

    return () => {
      mapInstance.remove();
    };
  }, [L, lugar.lat, lugar.lng, lugar.direccion, nombre]);

  return (
    <div
      id="leaflet-display-container"
      className="w-full h-full min-h-[260px] relative z-0"
    />
  );
}

export function MapDisplay({ lugar, nombre }: MapDisplayProps) {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    lugar.direccion || `${lugar.lat},${lugar.lng}`
  )}`;

  return (
    <div className="bg-card rounded-[22px] shadow-velada border border-line overflow-hidden animate-fade-up">
      {/* Contenedor del mapa */}
      <div className="h-[260px] w-full relative">
        <LeafletDisplayInner lugar={lugar} nombre={nombre} />
      </div>

      {/* Pie del mapa con información y botón de abrir mapa externo */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-t border-line/60 bg-card">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-[14px] text-ink truncate">
            {lugar.direccion.split(",")[0] || "Lugar de la cita"}
          </div>
          <div className="text-xs text-ink-soft truncate mt-0.5">
            {lugar.direccion}
          </div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-ink bg-paper hover:bg-paper/80 border border-line transition-colors"
        >
          <span>Abrir mapa</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
