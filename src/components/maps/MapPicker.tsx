"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ILugar } from "@/types";
import { MapPin, Search, Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  value: ILugar;
  onChange: (lugar: ILugar) => void;
  searchQuery?: string;
}

// Subcomponente Leaflet que se ejecuta solo en cliente
function LeafletMapInner({
  value,
  onChange,
}: {
  value: ILugar;
  onChange: (lugar: ILugar) => void;
}) {
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    // Crear icono personalizado tipo pin romántico de Velada
    const customIcon = L.divIcon({
      className: "custom-velada-pin",
      html: `
        <div style="transform: translate(-50%, -100%);">
          <svg width="32" height="42" viewBox="0 0 26 34" fill="none">
            <path d="M13 0C5.8 0 0 5.8 0 13c0 9.7 13 21 13 21s13-11.3 13-21C26 5.8 20.2 0 13 0z" fill="#B85C6B" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
            <circle cx="13" cy="13" r="5" fill="#FAF6F0"/>
          </svg>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });

    const mapContainer = document.getElementById("leaflet-picker-container");
    if (!mapContainer || map) return;

    const initialLat = value.lat || 25.6572;
    const initialLng = value.lng || -100.4024;

    const mapInstance = L.map("leaflet-picker-container").setView(
      [initialLat, initialLng],
      14
    );

    // Teselas gratuitas de OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance);

    const markerInstance = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(mapInstance);

    markerInstance.on("dragend", (e: any) => {
      const latlng = e.target.getLatLng();
      onChange({
        ...value,
        lat: Number(latlng.lat.toFixed(6)),
        lng: Number(latlng.lng.toFixed(6)),
      });
    });

    mapInstance.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      markerInstance.setLatLng([lat, lng]);
      onChange({
        ...value,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    });

    setMap(mapInstance);
    setMarker(markerInstance);

    return () => {
      mapInstance.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Actualizar vista del mapa si cambian las coordenadas externas (ej. por geocodificación)
  useEffect(() => {
    if (map && marker && value.lat && value.lng) {
      marker.setLatLng([value.lat, value.lng]);
      map.setView([value.lat, value.lng], map.getZoom() || 14, {
        animate: true,
      });
    }
  }, [value.lat, value.lng, map, marker]);

  return <div id="leaflet-picker-container" className="w-full h-full min-h-[220px]" />;
}

export function MapPicker({ value, onChange, searchQuery }: MapPickerProps) {
  const [searching, setSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const handleSearchAddress = async () => {
    const query = searchQuery || value.direccion;
    if (!query || query.trim().length < 3) {
      setSearchFeedback("Ingresa una dirección o lugar primero.");
      return;
    }

    setSearching(true);
    setSearchFeedback(null);

    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();

      if (data.success && data.results && data.results.length > 0) {
        const first = data.results[0];
        onChange({
          direccion: value.direccion || first.display_name,
          lat: first.lat,
          lng: first.lng,
        });
        setSearchFeedback(`Ubicado: ${first.display_name.slice(0, 45)}...`);
      } else {
        setSearchFeedback("No se encontraron coordenadas exactas. Puedes fijar el punto manualmente en el mapa.");
      }
    } catch {
      setSearchFeedback("Error al conectar con el servicio de mapas.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Ubicación en el mapa
        </label>
        <button
          type="button"
          onClick={handleSearchAddress}
          disabled={searching}
          className="inline-flex items-center gap-1.5 text-xs text-gold-deep hover:text-gold font-medium bg-gold/10 hover:bg-gold/20 px-2.5 py-1 rounded-lg transition-colors"
        >
          {searching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          <span>Localizar dirección en mapa</span>
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-line bg-paper/60 shadow-inner h-[220px]">
        <LeafletMapInner value={value} onChange={onChange} />

        <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-card/90 backdrop-blur px-3 py-1.5 rounded-full border border-line text-[11px] font-mono text-ink-soft shadow-sm flex items-center gap-1.5 pointer-events-none">
          <MapPin size={12} className="text-rose" />
          <span>Toca el mapa o arrastra el pin para fijar el lugar</span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-[1000] bg-card/90 backdrop-blur px-2.5 py-1 rounded-lg border border-line text-[10px] font-mono text-ink-soft">
          {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
        </div>
      </div>

      {searchFeedback && (
        <p className="text-[11px] font-mono text-gold-deep leading-relaxed">
          {searchFeedback}
        </p>
      )}
    </div>
  );
}
