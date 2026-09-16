"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { ICitaResponse, IRecuerdoIndependiente } from "@/types";
import { ThemeConfig } from "@/lib/theme";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Mail,
  Camera,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  X,
  Clock,
  MapPin,
} from "lucide-react";
import { triggerHaptic } from "@/lib/mobileNative";
import { AddPolaroidModal } from "@/components/dashboard/AddPolaroidModal";

interface AdventureCalendarProps {
  citas: ICitaResponse[];
  recuerdos: IRecuerdoIndependiente[];
  theme: ThemeConfig;
  onSelectCita: (cita: ICitaResponse) => void;
  onNewCita?: (date?: Date) => void;
  onRecuerdoAdded?: (nuevo: IRecuerdoIndependiente) => void;
}

export function AdventureCalendar({
  citas,
  recuerdos,
  theme,
  onSelectCita,
  onNewCita,
  onRecuerdoAdded,
}: AdventureCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddPolaroid, setShowAddPolaroid] = useState(false);
  const [polaroidDate, setPolaroidDate] = useState<Date>(new Date());
  const [selectedRecuerdoModal, setSelectedRecuerdoModal] =
    useState<IRecuerdoIndependiente | null>(null);

  const prevMonth = () => {
    triggerHaptic("light");
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    triggerHaptic("light");
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    triggerHaptic("light");
    setCurrentMonth(new Date());
  };

  // Generación de días del mes con relleno de semanas
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Comienza en Lunes
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="w-full bg-white/95 rounded-[26px] border border-slate-200/80 p-4 sm:p-6 shadow-card mb-8">
      {/* Barra de cabecera del calendario */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs ${theme.btnSolid}`}
          >
            <CalendarIcon size={22} />
          </div>
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-soft font-bold flex items-center gap-1">
              <Sparkles size={12} className={theme.textAccent} />
              Calendario de Veladas &amp; Recuerdos
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
          </div>
        </div>

        {/* Controles de mes */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-ink hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={prevMonth}
              title="Mes anterior"
              className="p-2 text-ink-soft hover:text-ink hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              title="Mes siguiente"
              className="p-2 text-ink-soft hover:text-ink hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
        {weekDayNames.map((name) => (
          <div
            key={name}
            className="text-[11px] sm:text-xs font-mono font-bold text-ink-soft uppercase tracking-wider py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Cuadrícula de días */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          // Buscar citas en este día
          const dayCitas = citas.filter((c) => {
            try {
              return isSameDay(new Date(c.horario), day);
            } catch {
              return false;
            }
          });

          // Buscar polaroids independientes en este día
          const dayRecuerdos = recuerdos.filter((r) => {
            try {
              return isSameDay(new Date(r.fecha), day);
            } catch {
              return false;
            }
          });

          // ¿Hay cita con polaroid asignada?
          const citaConPolaroid = dayCitas.find((c) =>
            Boolean(c.recuerdo?.fotoUrl)
          );
          // ¿Hay polaroid independiente?
          const primerRecuerdo = dayRecuerdos[0];

          // Determinar qué mostrar:
          // 1) Si hay cita y tiene polaroid -> mostrar Polaroid de la cita
          // 2) Si hay cita sin polaroid -> mostrar carta con corazón
          // 3) Si no hay cita pero hay polaroid independiente -> mostrar Polaroid independiente
          const tieneCita = dayCitas.length > 0;
          const polaroidAMostrar =
            citaConPolaroid?.recuerdo?.fotoUrl || primerRecuerdo?.fotoUrl;
          const pieDeFotoAMostrar =
            citaConPolaroid?.recuerdo?.pieDeFoto ||
            primerRecuerdo?.pieDeFoto ||
            citaConPolaroid?.nombre;

          return (
            <div
              key={day.toISOString()}
              onClick={() => {
                triggerHaptic("light");
                if (dayCitas.length > 0) {
                  onSelectCita(dayCitas[0]);
                } else if (primerRecuerdo) {
                  setSelectedRecuerdoModal(primerRecuerdo);
                } else {
                  setSelectedDay(day);
                }
              }}
              className={`min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group select-none overflow-hidden ${
                !isCurrentMonth
                  ? "bg-slate-50/40 text-slate-300 border-transparent"
                  : isTodayDate
                  ? "bg-white border-2 border-sky-400 shadow-xs"
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Número del día */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-sans font-bold ${
                    isTodayDate
                      ? "w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center -ml-0.5 -mt-0.5 shadow-2xs"
                      : isCurrentMonth
                      ? "text-ink"
                      : "text-slate-300"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {/* Badge flotante discreto si hay más de 1 cita */}
                {dayCitas.length > 1 && (
                  <span className="text-[9px] font-mono font-bold bg-sky-100 text-sky-800 px-1 rounded-full">
                    +{dayCitas.length}
                  </span>
                )}
              </div>

              {/* Contenido visual del día */}
              <div className="my-auto flex items-center justify-center">
                {polaroidAMostrar ? (
                  /* Reemplazo por Fotografía Polaroid */
                  <div
                    className="relative w-full aspect-square max-w-[56px] sm:max-w-[68px] mx-auto bg-white p-0.5 pb-2 rounded-xs shadow-sm border border-slate-200 group-hover:scale-105 transition-transform"
                    title={pieDeFotoAMostrar || "Recuerdo Polaroid"}
                  >
                    <div className="w-full aspect-square rounded-2xs overflow-hidden bg-slate-100">
                      <img
                        src={polaroidAMostrar}
                        alt="Polaroid"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-200/80 rounded-2xs shadow-2xs pointer-events-none" />
                  </div>
                ) : tieneCita ? (
                  /* Carta con corazón para citas sin polaroid */
                  <div
                    className="relative flex flex-col items-center justify-center p-1 rounded-xl bg-gradient-to-tr from-sky-50 to-blue-100/70 border border-sky-200/90 shadow-2xs group-hover:scale-105 transition-transform w-full py-1.5"
                    title={`Cita: ${dayCitas[0].nombre}`}
                  >
                    <div className="relative">
                      {/* Mini sobre de carta */}
                      <div className="w-7 h-5 sm:w-8 sm:h-6 bg-white rounded-md border border-sky-300 shadow-2xs flex items-center justify-center relative overflow-hidden">
                        <svg
                          viewBox="0 0 32 20"
                          className="w-full h-full text-sky-200"
                        >
                          <polygon
                            points="0,0 32,0 16,11"
                            fill="#E0F2FE"
                            stroke="#BAE6FD"
                            strokeWidth="1"
                          />
                        </svg>
                        {/* Corazón en la carta */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Heart
                            size={12}
                            className="fill-rose-500 text-rose-500 drop-shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-serif font-bold text-sky-900 truncate max-w-full px-1 mt-0.5">
                      {dayCitas[0].nombre}
                    </span>
                  </div>
                ) : (
                  /* Día libre / vacío */
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:text-ink hover:bg-slate-200 flex items-center justify-center text-xs">
                      <Plus size={13} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Opciones para Día Vacío */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-up">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full border border-sky-100 shadow-2xl relative">
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-ink-soft hover:text-ink flex items-center justify-center"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-5">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-sky-700 font-bold">
                Día Seleccionado
              </span>
              <h3 className="font-serif text-xl font-bold text-ink capitalize mt-0.5">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              <p className="text-xs text-ink-soft mt-1">
                ¿Qué te gustaría agregar para esta fecha?
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  const date = selectedDay;
                  setSelectedDay(null);
                  onNewCita?.(date);
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Escribir carta / agendar cita</span>
                  <span className="text-[10.5px] text-white/80">
                    Envía una invitación a tu pareja
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const date = selectedDay;
                  setSelectedDay(null);
                  setPolaroidDate(date);
                  setShowAddPolaroid(true);
                }}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 text-ink font-semibold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Camera size={16} />
                </div>
                <div className="text-left">
                  <span className="block font-bold">Subir foto Polaroid</span>
                  <span className="text-[10.5px] text-ink-soft">
                    Guarda un recuerdo fotográfico en esta fecha
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Ver Foto Polaroid Independiente al tocarla en el calendario */}
      {selectedRecuerdoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm animate-fade-up">
          <div className="bg-white p-4 sm:p-5 pb-8 rounded-sm shadow-2xl max-w-xs w-full text-center border border-slate-200 relative transform rotate-[-1deg]">
            <button
              onClick={() => setSelectedRecuerdoModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-ink text-white hover:bg-ink/80 flex items-center justify-center shadow-md cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Washi Tape */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-amber-200/90 border border-amber-300 shadow-2xs" />

            <div className="relative aspect-square w-full rounded-xs overflow-hidden bg-slate-100 mb-3 border border-slate-200 mt-2">
              <img
                src={selectedRecuerdoModal.fotoUrl}
                alt={selectedRecuerdoModal.pieDeFoto || "Recuerdo Polaroid"}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="font-handwriting text-lg text-ink font-bold leading-tight">
              {selectedRecuerdoModal.pieDeFoto || "Nuestro Momento"}
            </p>
            <p className="text-[10.5px] font-mono text-ink-soft uppercase tracking-wider mt-1">
              {format(
                new Date(selectedRecuerdoModal.fecha),
                "d 'de' MMMM, yyyy",
                { locale: es }
              )}
            </p>
          </div>
        </div>
      )}

      {/* Modal para Agregar Polaroid */}
      <AddPolaroidModal
        isOpen={showAddPolaroid}
        initialDate={polaroidDate}
        onClose={() => setShowAddPolaroid(false)}
        onSuccess={(nuevo) => {
          onRecuerdoAdded?.(nuevo);
        }}
      />
    </div>
  );
}
