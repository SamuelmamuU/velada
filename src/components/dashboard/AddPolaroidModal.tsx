"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IRecuerdoIndependiente } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  Calendar,
  Sparkles,
  Heart,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobileNative";

interface AddPolaroidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevoRecuerdo: IRecuerdoIndependiente) => void;
  initialDate?: Date;
}

const PRESET_MEMORIES = [
  { url: "/polaroids/ANIVERSARIO.jpg", label: "Aniversario" },
  { url: "/polaroids/SANTALUCIA.jpg", label: "Paseo Santa Lucía" },
  { url: "/polaroids/CABANA.jpg", label: "Fin de semana en Cabaña" },
  { url: "/polaroids/ARCADE.jpg", label: "Tarde de Juegos Arcade" },
  { url: "/polaroids/GRADUACION.jpg", label: "Día de Graduación" },
  { url: "/polaroids/VOLUNTARIOS.jpg", label: "Día de Voluntariado" },
];

export function AddPolaroidModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
}: AddPolaroidModalProps) {
  const { token } = useAuth();
  const [photoUrl, setPhotoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [dateStr, setDateStr] = useState(() =>
    format(initialDate || new Date(), "yyyy-MM-dd")
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen no debe superar los 8MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setError("Por favor selecciona o sube una fotografía para la Polaroid.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const memoryPayload = {
      fotoUrl: photoUrl,
      pieDeFoto: caption.trim(),
      fecha: new Date(dateStr + "T12:00:00").toISOString(),
    };

    // Guardado en caché local para persistencia instantánea
    try {
      const local = JSON.parse(
        localStorage.getItem("velada_polaroids_libres") || "[]"
      );
      const tempId = "polaroid_" + Date.now();
      const localObj: IRecuerdoIndependiente = {
        id: tempId,
        ...memoryPayload,
        createdAt: new Date().toISOString(),
      };
      local.unshift(localObj);
      localStorage.setItem("velada_polaroids_libres", JSON.stringify(local));
    } catch {}

    try {
      const res = await fetch("/api/recuerdos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(memoryPayload),
      });
      const data = await res.json();
      if (data.success && data.recuerdo) {
        triggerHaptic("success");
        onSuccess(data.recuerdo);
        onClose();
      } else {
        // Fallback local si el servidor da advertencia
        const fallbackObj: IRecuerdoIndependiente = {
          id: "polaroid_" + Date.now(),
          ...memoryPayload,
          createdAt: new Date().toISOString(),
        };
        onSuccess(fallbackObj);
        onClose();
      }
    } catch {
      const fallbackObj: IRecuerdoIndependiente = {
        id: "polaroid_" + Date.now(),
        ...memoryPayload,
        createdAt: new Date().toISOString(),
      };
      onSuccess(fallbackObj);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-up overflow-y-auto">
      <div className="bg-white rounded-[26px] p-6 max-w-md w-full border border-sky-100 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sky-50 text-ink-soft hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-white shadow-xs">
            <Camera size={20} />
          </div>
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-sky-700 font-bold flex items-center gap-1">
              <Sparkles size={12} />
              Álbum y Calendario
            </span>
            <h3 className="font-serif text-xl font-bold text-ink">
              Nueva Foto Polaroid
            </h3>
          </div>
        </div>

        <p className="text-xs text-ink-soft mb-4">
          Inmortaliza cualquier momento especial de su relación, aunque no esté
          ligado a una cita específica.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vista previa de la Polaroid */}
          <div className="flex justify-center">
            <div className="bg-white p-3 pb-6 rounded-sm shadow-md border border-slate-200 w-44 transform rotate-[-1deg] text-center">
              <div className="aspect-square w-full rounded-xs overflow-hidden bg-slate-100 mb-2 border border-slate-200 flex items-center justify-center">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <Camera size={28} />
                    <span className="text-[10px] mt-1 font-mono">Sin foto</span>
                  </div>
                )}
              </div>
              <p className="font-handwriting text-ink text-sm font-bold truncate">
                {caption || "Dedicatoria..."}
              </p>
            </div>
          </div>

          {/* Subir archivo desde el dispositivo */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Fotografía desde tu galería o cámara
            </label>
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 cursor-pointer transition-colors text-xs text-sky-800 font-medium">
              <ImageIcon size={16} />
              <span>Seleccionar imagen del dispositivo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Galería de fotos precargadas */}
          <div>
            <span className="block text-[11px] font-semibold text-ink-soft mb-1.5">
              O elige una de nuestras fotos de ejemplo:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MEMORIES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPhotoUrl(preset.url);
                    if (!caption) setCaption(preset.label);
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    photoUrl === preset.url
                      ? "border-sky-500 ring-2 ring-sky-400"
                      : "border-slate-200 hover:opacity-80"
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-ink/60 text-white text-[9px] py-0.5 px-1 truncate text-center">
                    {preset.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fecha para el calendario */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Fecha en el Calendario
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Dedicatoria manuscrita */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Dedicatoria / Pie de foto
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej. Tarde de risas juntos..."
              maxLength={60}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 font-handwriting text-base"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-ink-soft hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !photoUrl}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <Heart size={14} className="fill-white" />
                  <span>Guardar Polaroid</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
