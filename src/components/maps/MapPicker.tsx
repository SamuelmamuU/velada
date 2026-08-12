"use client";

import React, { useEffect, useState, useRef } from "react";
import { ILugar } from "@/types";
import { MapPin, Search, Loader2, AlertCircle, Check } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  value: ILugar;
  onChange: (lugar: ILugar) => void;
  searchQuery?: string;
}

interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
  type?: string;
}

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
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    import("leaflet")
      .then((leaflet) => {
        setL(leaflet.default || leaflet);
      })
      .catch(() => setMapError(true));
  }, []);

  useEffect(() => {
    if (!L) return;

    const mapContainer = document.getElementById("leaflet-picker-container");
    if (!mapContainer || map) return;

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

    const initialLat = typeof value.lat === "number" && !isNaN(value.lat) ? value.lat : 25.6572;
    const initialLng = typeof value.lng === "number" && !isNaN(value.lng) ? value.lng : -100.4024;

    try {
      const mapInstance = L.map("leaflet-picker-container", {
        scrollWheelZoom: true,
      }).setView([initialLat, initialLng], 14);

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
    } catch {
      setMapError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Actualizar vista del mapa si cambian las coordenadas externas
  useEffect(() => {
    if (map && marker && typeof value.lat === "number" && typeof value.lng === "number") {
      marker.setLatLng([value.lat, value.lng]);
      map.setView([value.lat, value.lng], map.getZoom() || 14, {
        animate: true,
      });
    }
  }, [value.lat, value.lng, map, marker]);

  if (mapError) {
    return (
      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-4 bg-paper text-ink-soft text-center text-xs">
        <AlertCircle size={20} className="text-rose mb-1.5" />
        <p>No se pudo cargar el mapa interactivo. Puedes ingresar la dirección en texto.</p>
      </div>
    );
  }

  return <div id="leaflet-picker-container" className="w-full h-full min-h-[220px]" />;
}

export function MapPicker({ value, onChange, searchQuery }: MapPickerProps) {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchAddress = async () => {
    const query = searchQuery || value.direccion;
    if (!query || query.trim().length < 3) {
      setSearchFeedback("Ingresa una dirección o nombre de lugar primero.");
      return;
    }

    setSearching(true);
    setSearchFeedback(null);
    setSearchResults([]);

    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
        setShowDropdown(true);

        // Seleccionar automáticamente el primer resultado
        const first = data.results[0];
        onChange({
          direccion: value.direccion || first.display_name,
          lat: first.lat,
          lng: first.lng,
        });

        if (data.results.length === 1) {
          setSearchFeedback(`Ubicado: ${first.display_name.slice(0, 50)}...`);
        } else {
          setSearchFeedback(`Se encontraron ${data.results.length} coincidencias. Selecciona la más precisa abajo si deseas cambiarla.`);
        }
      } else {
        setSearchFeedback("No se encontraron coordenadas exactas. Puedes tocar el mapa directamente para fijar el punto.");
      }
    } catch {
      setSearchFeedback("Error de conexión con el servicio de mapas.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (item: GeocodeResult) => {
    onChange({
      direccion: value.direccion || item.display_name,
      lat: item.lat,
      lng: item.lng,
    });
    setShowDropdown(false);
    setSearchFeedback(`Ubicación fijada: ${item.display_name.slice(0, 50)}...`);
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Ubicación en el mapa
        </label>
        <button
          type="button"
          onClick={handleSearchAddress}
          disabled={searching}
          className="inline-flex items-center gap-1.5 text-xs text-gold-deep hover:text-gold font-medium bg-gold/10 hover:bg-gold/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          {searching ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          <span>Localizar dirección en mapa</span>
        </button>
      </div>

      {/* Menú desplegable de sugerencias de geocodificación */}
      {showDropdown && searchResults.length > 1 && (
        <div className="absolute z-[2000] top-8 right-0 left-0 bg-card rounded-xl border border-line shadow-2xl p-2 max-h-48 overflow-y-auto space-y-1 animate-fade-up">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-ink-soft font-semibold">
            Sugerencias encontradas:
          </div>
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectResult(item)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-paper text-ink transition-colors flex items-start gap-2"
            >
              <MapPin size={14} className="text-rose flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contenedor del Mapa */}
      <div className="relative rounded-2xl overflow-hidden border border-line bg-paper/60 shadow-inner h-[220px]">
        <LeafletMapInner value={value} onChange={onChange} />

        <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-card/90 backdrop-blur px-3 py-1.5 rounded-full border border-line text-[11px] font-mono text-ink-soft shadow-sm flex items-center gap-1.5 pointer-events-none">
          <MapPin size={12} className="text-rose" />
          <span>Toca el mapa o arrastra el pin para fijar el lugar exacto</span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-[1000] bg-card/90 backdrop-blur px-2.5 py-1 rounded-lg border border-line text-[10px] font-mono text-ink-soft">
          {typeof value.lat === "number" ? value.lat.toFixed(4) : "0.0000"},{" "}
          {typeof value.lng === "number" ? value.lng.toFixed(4) : "0.0000"}
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
