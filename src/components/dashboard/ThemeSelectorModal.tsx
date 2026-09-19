"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { THEMES, ThemeKey } from "@/lib/theme";
import { ModeloBuzon } from "@/types";
import {
  X,
  Check,
  Palette,
  Sparkles,
  Heart,
  Loader2,
  Mail,
  Box,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobileNative";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModeloBuzonOption {
  id: ModeloBuzon;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: typeof Mail;
}

const MODELOS_BUZON_OPTIONS: ModeloBuzonOption[] = [
  {
    id: "clasico",
    nombre: "Clásico Romántico",
    subtitulo: "Buzón Abovedado Tradicional",
    descripcion:
      "Túnel curvo esmaltado satinado con herrajes de latón dorado y banderín postal rojo.",
    badge: "Esmaltado Domo",
    badgeBg: "bg-sky-100",
    badgeColor: "text-sky-800",
    icon: Mail,
  },
  {
    id: "vintage",
    nombre: "Vintage Hierro & Bronce",
    subtitulo: "Cofre Victoriano de Época",
    descripcion:
      "Techo a dos aguas en hierro forjado oscuro con candado de latón y relieve ornamental.",
    badge: "Cofre Forjado",
    badgeBg: "bg-amber-100",
    badgeColor: "text-amber-900",
    icon: Box,
  },
  {
    id: "moderno",
    nombre: "Moderno Pastel & Amor",
    subtitulo: "Bloque Minimalista Contemporáneo",
    descripcion:
      "Aristas suaves en tono pastel degradado, ranura superior para sobres y banderín de corazón.",
    badge: "Minimalista Pastel",
    badgeBg: "bg-rose-100",
    badgeColor: "text-rose-800",
    icon: Sparkles,
  },
];

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { user, pareja, token, refreshPareja } = useAuth();
  const isNovio = user?.rol === "novio";
  const partnerName =
    user?.nombrePareja || pareja?.parejaNombre || (isNovio ? "tu novia" : "tu novio");

  const [activeTab, setActiveTab] = useState<"color" | "buzon">("color");

  const initialThemeKey = (
    pareja?.colorDashboardNovia ||
    pareja?.colorDashboardNovio ||
    (isNovio ? "azul" : "rosa")
  ) as ThemeKey;

  const initialModeloBuzon = (pareja?.modeloBuzon || "clasico") as ModeloBuzon;

  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(initialThemeKey);
  const [selectedModelo, setSelectedModelo] = useState<ModeloBuzon>(initialModeloBuzon);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && pareja) {
      if (pareja.colorDashboardNovia || pareja.colorDashboardNovio) {
        setSelectedTheme(
          (pareja.colorDashboardNovia || pareja.colorDashboardNovio) as ThemeKey
        );
      }
      if (pareja.modeloBuzon) {
        setSelectedModelo(pareja.modeloBuzon as ModeloBuzon);
      }
    }
  }, [isOpen, pareja]);

  if (!isOpen || !mounted) return null;

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
        body: JSON.stringify({
          color: selectedTheme,
          modeloBuzon: selectedModelo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic("success");
        setMessage("¡Listo! Personalización compartida asignada a la pareja.");
        try {
          localStorage.setItem("velada_theme_novia", selectedTheme);
          localStorage.setItem("velada_theme_novio", selectedTheme);
          localStorage.setItem("velada_modelo_buzon", selectedModelo);
          window.dispatchEvent(new CustomEvent("velada_modelo_buzon_changed", { detail: selectedModelo }));
        } catch {}
        await refreshPareja();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage(data.error || "No se pudo guardar la personalización.");
      }
    } catch {
      setMessage("Error de conexión al guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-fade-up">
      <div className="bg-white rounded-[26px] p-6 sm:p-7 max-w-lg w-full border border-sky-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-sky-50 text-ink-soft hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-amber-400 to-sky-400 flex items-center justify-center text-white shadow-xs">
            <Palette size={20} />
          </div>
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-sky-700 font-bold flex items-center gap-1">
              <Sparkles size={12} />
              Personalización de Pareja
            </span>
            <h3 className="font-serif text-xl font-bold text-ink">
              Diseño &amp; Modelo del Buzón
            </h3>
          </div>
        </div>

        {/* Selector de Pestañas (Color vs Modelo 3D) */}
        <div className="flex items-center gap-1.5 p-1 bg-sky-50/80 rounded-2xl mb-4 border border-sky-100">
          <button
            type="button"
            onClick={() => setActiveTab("color")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "color"
                ? "bg-white text-sky-900 shadow-xs border border-sky-200"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Palette size={14} />
            <span>Color Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("buzon")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "buzon"
                ? "bg-white text-sky-900 shadow-xs border border-sky-200"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Mail size={14} />
            <span>Modelo 3D del Buzón</span>
          </button>
        </div>

        {/* Pestaña: Color Dashboard */}
        {activeTab === "color" && (
          <div className="overflow-y-auto space-y-4 flex-1 pr-1">
            <p className="text-ink-soft text-xs leading-relaxed">
              Elijan juntos la paleta de color para su diario y panel. Tanto tu pantalla como la de{" "}
              <strong className="text-ink">{partnerName}</strong> tendrán el mismo color.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-2">
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
          </div>
        )}

        {/* Pestaña: Modelo 3D del Buzón */}
        {activeTab === "buzon" && (
          <div className="overflow-y-auto space-y-3.5 flex-1 pr-1">
            <p className="text-ink-soft text-xs leading-relaxed">
              Seleccionen el modelo 3D con el que interactuarán al enviar y desdoblar sus cartas de amor en la escena interactiva.
            </p>

            <div className="space-y-3">
              {MODELOS_BUZON_OPTIONS.map((opt) => {
                const isSelected = selectedModelo === opt.id;
                const IconComp = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelo(opt.id);
                      triggerHaptic("light");
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all relative flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? "border-sky-500 ring-2 ring-sky-300/60 bg-sky-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center ${
                        isSelected
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <IconComp size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-sm text-ink">
                            {opt.nombre}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${opt.badgeBg} ${opt.badgeColor}`}
                          >
                            {opt.badge}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Check size={12} />
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-medium text-sky-800 mb-0.5">
                        {opt.subtitulo}
                      </p>
                      <p className="text-[11px] text-ink-soft leading-snug">
                        {opt.descripcion}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {message && (
          <div className="mt-3 p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs text-center font-medium animate-fade-up">
            {message}
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3 shrink-0">
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
                <span>Guardar Selección</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
