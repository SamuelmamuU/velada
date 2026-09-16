"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { THEMES, ThemeKey } from "@/lib/theme";
import { X, Check, Palette, Sparkles, Heart, Loader2 } from "lucide-react";
import { triggerHaptic } from "@/lib/mobileNative";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { user, pareja, token, refreshPareja } = useAuth();
  const isNovio = user?.rol === "novio";
  const partnerName =
    user?.nombrePareja || pareja?.parejaNombre || (isNovio ? "tu novia" : "tu novio");

  // El tema que el usuario actual va a cambiar es el de su pareja:
  // Si soy novio, configuro colorDashboardNovia. Si soy novia, colorDashboardNovio.
  const initialThemeKey = (
    isNovio
      ? pareja?.colorDashboardNovia || "rosa"
      : pareja?.colorDashboardNovio || "azul"
  ) as ThemeKey;

  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(initialThemeKey);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/pareja/tema", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ color: selectedTheme }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        setMessage(`¡Listo! El dashboard de ${partnerName} ahora se vestirá en este color.`);
        // Guardar localmente para reflejo instantáneo si ambos comparten dispositivo
        try {
          if (isNovio) {
            localStorage.setItem("velada_theme_novia", selectedTheme);
          } else {
            localStorage.setItem("velada_theme_novio", selectedTheme);
          }
        } catch {}
        await refreshPareja();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage(data.error || "No se pudo guardar el color.");
      }
    } catch {
      setMessage("Error de conexión al guardar el color.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-up">
      <div className="bg-white rounded-[26px] p-6 sm:p-7 max-w-md w-full border border-sky-100 shadow-2xl relative overflow-hidden">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sky-50 text-ink-soft hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-sky-400 flex items-center justify-center text-white shadow-xs">
            <Palette size={20} />
          </div>
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-sky-700 font-bold flex items-center gap-1">
              <Sparkles size={12} />
              Personalización en pareja
            </span>
            <h3 className="font-serif text-xl font-bold text-ink">
              Color para {partnerName}
            </h3>
          </div>
        </div>

        <p className="text-ink-soft text-xs sm:text-sm mt-1 mb-5 leading-relaxed">
          Tú decides la paleta de color con la que{" "}
          <strong className="text-ink">{partnerName}</strong> disfrutará de su
          dashboard, cartas y calendarios de veladas.
        </p>

        {/* Malla de temas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const t = THEMES[key];
            const isSelected = selectedTheme === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedTheme(key);
                  triggerHaptic("light");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-sky-500 ring-2 ring-sky-300/60 bg-sky-50/40 shadow-sm scale-[1.02]"
                    : "border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full shadow-2xs border border-white flex-shrink-0"
                      style={{ backgroundColor: t.primaryHex }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-2xs border border-white -ml-2"
                      style={{ backgroundColor: t.secondaryHex }}
                    />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs">
                      <Check size={12} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-ink leading-tight">
                    {t.name}
                  </h4>
                  <p className="text-[10.5px] text-ink-soft line-clamp-1 mt-0.5">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs text-center font-medium animate-fade-up">
            {message}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-ink-soft text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Heart size={15} className="fill-white" />
                <span>Guardar para {partnerName}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
