"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Sparkles, Heart } from "lucide-react";
import { ICitaResponse } from "@/types";

interface CalendarMobileWidgetProps {
  citas?: ICitaResponse[];
  onSelectCita?: (cita: ICitaResponse) => void;
  className?: string;
}

export function CalendarMobileWidget({
  citas = [],
  onSelectCita,
  className = "",
}: CalendarMobileWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const coinContainerRef = useRef<HTMLDivElement>(null);

  // Días del mes para la cuadrícula
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Próxima cita más cercana
  const now = new Date();
  const upcomingCitas = citas
    .filter((c) => new Date(c.horario) >= now && c.estado !== "cancelada")
    .sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());
  const nextCita = upcomingCitas[0] || null;

  // Animación 3D de moneda/sello de fecha con Three.js
  useEffect(() => {
    const container = coinContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 64;
    const height = container.clientHeight || 64;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffecd2, 2.5);
    light.position.set(5, 8, 10);
    scene.add(light);

    // Textura canvas para el número de hoy en la moneda
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 110px "Georgia", serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(new Date().getDate().toString(), 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const coinGeom = new THREE.CylinderGeometry(1.45, 1.45, 0.28, 32);
    coinGeom.rotateX(Math.PI / 2);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xecb249,
      roughness: 0.22,
      metalness: 0.9,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.5,
    });

    const coinMesh = new THREE.Mesh(coinGeom, [goldMat, faceMat, goldMat]);
    scene.add(coinMesh);

    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      coinMesh.rotation.y = Math.sin(elapsed * 1.8) * 0.45;
      coinMesh.rotation.x = Math.cos(elapsed * 1.4) * 0.2;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      coinGeom.dispose();
      goldMat.dispose();
      faceMat.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#162738]/90 to-[#0e1724]/95 border border-amber-300/30 shadow-2xl backdrop-blur-md p-4 text-white select-none ${className}`}
    >
      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Moneda 3D interactiva en Three.js con el número de hoy */}
          <div
            ref={coinContainerRef}
            className="w-10 h-10 flex-shrink-0 cursor-pointer"
            title="Día actual en 3D"
          />

          <div>
            <h4 className="text-xs font-bold font-serif tracking-wide text-amber-100 capitalize leading-none">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h4>
            <p className="text-[10px] text-amber-300/80 font-mono mt-0.5">Calendario de Veladas</p>
          </div>
        </div>

        {/* Controles de mes */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="p-1 hover:bg-white/10 rounded text-amber-200 transition-colors cursor-pointer"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-1.5 text-[9px] font-bold text-amber-200 hover:text-white uppercase transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="p-1 hover:bg-white/10 rounded text-amber-200 transition-colors cursor-pointer"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Cuadrícula mensual de calendario */}
      <div className="bg-white/5 rounded-2xl p-2.5 border border-white/5 mb-3">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 text-center mb-1.5">
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <span key={i} className="text-[9.5px] font-bold text-amber-200/60 font-mono">
              {d}
            </span>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isDayToday = isToday(day);

            // Citas en este día
            const dayCitas = citas.filter(
              (c) => isSameDay(new Date(c.horario), day) && c.estado !== "cancelada"
            );
            const hasCita = dayCitas.length > 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => hasCita && onSelectCita?.(dayCitas[0])}
                className={`relative py-1 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-all ${
                  !isCurrentMonth
                    ? "text-white/20"
                    : isDayToday
                    ? "bg-amber-500 text-sky-950 font-bold shadow-xs scale-105"
                    : hasCita
                    ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-400/40 cursor-pointer hover:bg-rose-500/30"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                <span>{format(day, "d")}</span>
                {hasCita && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta de Próxima Cita */}
      {nextCita ? (
        <div
          onClick={() => onSelectCita?.(nextCita)}
          className="bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-300/30 rounded-2xl p-2.5 flex items-center justify-between cursor-pointer hover:border-rose-300/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-rose-500/30 border border-rose-400/40 flex items-center justify-center flex-shrink-0">
              <Heart size={15} className="text-rose-300 fill-rose-300" />
            </div>
            <div className="overflow-hidden">
              <h5 className="text-[11px] font-bold text-white truncate leading-tight">
                {nextCita.nombre}
              </h5>
              <div className="flex items-center gap-1.5 text-[9.5px] text-amber-200/80 mt-0.5 truncate">
                <span>{format(new Date(nextCita.horario), "d 'de' MMM, HH:mm", { locale: es })}</span>
                <span>•</span>
                <span className="truncate flex items-center gap-0.5">
                  <MapPin size={9} />
                  {nextCita.lugar?.direccion || "Lugar secreto"}
                </span>
              </div>
            </div>
          </div>
          <Sparkles size={14} className="text-amber-400 animate-pulse flex-shrink-0 ml-2" />
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl p-2 text-center text-[10px] text-white/50 border border-white/5">
          <span>No hay citas próximas agendadas</span>
        </div>
      )}
    </div>
  );
}
