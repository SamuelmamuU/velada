"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sparkles, Calendar, PlusCircle, Heart } from "lucide-react";

function DashboardContent() {
  const { user, switchDemoRole } = useAuth();
  const isNovio = user?.rol === "novio";

  return (
    <div className="min-h-screen bg-ivory text-ink">
      {/* Barra de control rápido de roles */}
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 bg-[#2B2438]/95 backdrop-blur text-white text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-ivory/50 uppercase tracking-widest text-[11px]">
            Sesión activa ·
          </span>
          <span className="bg-gold/20 text-gold font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
            {isNovio ? "Rol Novio (Editor)" : "Rol Novia (Solo Lectura)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ivory/50 text-[11px] hidden sm:inline">Cambiar rol:</span>
          <button
            onClick={() => switchDemoRole(isNovio ? "novia" : "novio")}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-gold hover:text-ink transition-colors font-sans text-xs font-medium"
          >
            Cambiar a {isNovio ? "Novia 💛" : "Novio 🎩"}
          </button>
        </div>
      </div>

      <div className="max-w-[1040px] mx-auto px-6 py-10 sm:py-12">
        <AppHeader />

        {/* Sección de bienvenida */}
        <section className="bg-card rounded-2xl p-8 border border-line shadow-velada mb-8 animate-fade-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-soft flex items-center justify-center text-rose flex-shrink-0">
              <Heart className="w-6 h-6 fill-rose" />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-gold-deep font-semibold mb-1">
                Autenticación y Sesión Lista · Fase 4
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink mb-2">
                ¡Bienvenido a Velada, {user?.nombre}!
              </h1>
              <p className="text-ink-soft text-sm leading-relaxed max-w-2xl">
                {isNovio ? (
                  <>
                    Has iniciado sesión como <strong>Novio</strong>. Tienes permisos
                    completos para diseñar, crear, agendar y editar citas con mapa y temática.
                  </>
                ) : (
                  <>
                    Has iniciado sesión como <strong>Novia</strong>. Tu panel te permite
                    ver tus citas agendadas, mapas interactivos y sincronizar a tu calendario con un clic.
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Criterios y estado de la sesión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl p-6 border border-line shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-paper flex items-center justify-center text-gold-deep">
                <Sparkles size={18} />
              </div>
              <h2 className="font-serif text-lg font-semibold">Permisos de tu cuenta</h2>
            </div>
            <ul className="text-xs text-ink-soft space-y-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-[#3E7A3D]">✓</span> Iniciar sesión con JWT y cookies seguras
              </li>
              <li className="flex items-center gap-2">
                <span className={isNovio ? "text-[#3E7A3D]" : "text-ink-soft/40"}>
                  {isNovio ? "✓" : "✗"}
                </span>{" "}
                Crear y editar citas ({isNovio ? "Permitido" : "Solo lectura"})
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#3E7A3D]">✓</span> Visualización de mapas y descarga .ics
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-line shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-paper flex items-center justify-center text-rose">
                {isNovio ? <PlusCircle size={18} /> : <Calendar size={18} />}
              </div>
              <h2 className="font-serif text-lg font-semibold">
                {isNovio ? "Próximo paso: Fase 5" : "Próximo paso: Fase 6"}
              </h2>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              {isNovio
                ? "Construcción del formulario de creación y panel de gestión de citas del Novio con selector de mapas interactivo."
                : "Construcción del feed de invitaciones de la Novia con contador regresivo, mapas y botón de Google Calendar."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
