"use client";

import React, { useEffect, useState } from "react";
import { ILugar } from "@/types";
import { ExternalLink, MapPin, AlertCircle } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapDisplayProps {
  lugar: ILugar;
  nombre: string;
}

function LeafletDisplayInner({ lugar, nombre }: MapDisplayProps) {
  const [L, setL] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    import("leaflet")
      .then((leaflet) => {
        setL(leaflet.default || leaflet);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!L) return;

    const mapContainer = document.getElementById("leaflet-display-container");
    if (!mapContainer) return;

    const lat =
      typeof lugar.lat === "number" && !isNaN(lugar.lat) ? lugar.lat : 25.6572;
    const lng =
      typeof lugar.lng === "number" && !isNaN(lugar.lng)
        ? lugar.lng
        : -100.4024;

    const customIcon = L.divIcon({
      className: "custom-velada-pin-display",
      html: `
        <div style="transform: translate(-50%, -100%); animation: bob 2.2s ease-in-out infinite;">
          <svg width="36" height="46" viewBox="0 0 26 34" fill="none">
            <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="#B85C6B" filter="drop-shadow(0 6px 10px rgba(43,36,56,0.4))"/>
            <circle cx="13" cy="13" r="5" fill="#FAF6F0"/>
          </svg>
        </div>
      `,
      iconSize: [36, 46],
      iconAnchor: [18, 46],
    });

    try {
      const mapInstance = L.map("leaflet-display-container", {
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance);

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(
        mapInstance
      );

      marker.bindPopup(
        `<div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #2B2438;">
          <strong style="font-family: serif; font-size: 14px;">${nombre}</strong><br/>
          <span style="color: #584C68;">${lugar.direccion}</span>
        </div>`
      );

      return () => {
        mapInstance.remove();
      };
    } catch {
      setError(true);
    }
  }, [L, lugar.lat, lugar.lng, lugar.direccion, nombre]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-6 bg-paper text-center">
        <MapPin size={32} className="text-rose mb-2" />
        <h4 className="font-serif font-semibold text-sm text-ink mb-1">
          {lugar.direccion}
        </h4>
        <p className="text-xs text-ink-soft">
          Coordenadas: {lugar.lat}, {lugar.lng}
        </p>
      </div>
    );
  }

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
      <div className="h-[260px] w-full relative bg-paper/50">
        <LeafletDisplayInner lugar={lugar} nombre={nombre} />
      </div>

      {/* Pie del mapa con información y enlace directo */}
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
