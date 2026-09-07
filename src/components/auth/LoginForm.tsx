"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { AppLogo } from "@/components/ui/AppLogo";
import { RolUsuario } from "@/types";
import { Lock, Mail, AlertCircle, Loader2, User, Heart, ArrowRight } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();

  const [role, setRole] = useState<RolUsuario>("novia");
  const [email, setEmail] = useState("novia@velada.app");
  const [password, setPassword] = useState("NoviaVelada2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isZoomingOut, setIsZoomingOut] = useState(false);

  const handleRoleChange = (selectedRole: RolUsuario) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "novio") {
      setEmail("novio@velada.app");
      setPassword("NovioVelada2026!");
    } else {
      setEmail("novia@velada.app");
      setPassword("NoviaVelada2026!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "No se pudo iniciar sesión. Verifica tus credenciales.");
      setLoading(false);
    } else {
      // Activar animación de zoom out hacia el encuadre general del buzón
      setIsZoomingOut(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div
        animate={
          isZoomingOut
            ? {
                scale: [1, 1.04, 0.65],
                opacity: [1, 1, 0],
                y: [0, -10, 40],
              }
            : { scale: 1, opacity: 1, y: 0 }
        }
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 py-6"
      >
        {/* ========================================================================= */}
        {/* LADO IZQUIERDO: EL BUZÓN CON EL NOMBRES "SAMUEL Y DIANA" PINTADOS A MANO */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center select-none">
          {/* Placa superior con efecto de brochazo / pintura hecha a mano */}
          <div className="relative mb-3 flex flex-col items-center">
            {/* Trazo de brocha rústico de pintura en acuarela/acrílico blanco-crema */}
            <svg
              className="absolute -inset-x-6 -inset-y-3 w-[calc(100%+48px)] h-[calc(100%+24px)] text-white/90 drop-shadow-sm -z-10"
              viewBox="0 0 280 60"
              fill="currentColor"
              preserveAspectRatio="none"
            >
              <path d="M 12 18 Q 80 4 140 10 Q 210 5 268 16 Q 275 35 260 48 Q 180 56 120 50 Q 50 55 10 42 Q 4 28 12 18 Z" />
            </svg>

            {/* Texto de pintura hecha a mano: "Samuel y Diana" */}
            <div className="px-6 py-1.5 text-center">
              <span
                className="font-handwriting text-3xl sm:text-4xl text-sky-950 font-bold tracking-wide block drop-shadow-[0_1px_1px_rgba(40,75,110,0.25)]"
                style={{
                  transform: "rotate(-1.5deg)",
                  textShadow:
                    "1px 1px 0 rgba(255,255,255,0.8), -1px -1px 0 rgba(100,150,200,0.15)",
                }}
              >
                Samuel & Diana
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.25em] text-sky-700/80 block mt-0.5">
                Buzón del Hogar
              </span>
            </div>
          </div>

          {/* Ilustración artesanal del buzón de correos */}
          <div className="relative w-60 sm:w-72 h-64 sm:h-72 flex items-center justify-center">
            {/* Halo suave detrás del buzón */}
            <div className="absolute inset-0 bg-sky-300/20 rounded-full blur-3xl -z-10" />

            <svg
              viewBox="0 0 240 240"
              className="w-full h-full drop-shadow-[0_18px_25px_rgba(25,50,85,0.25)]"
            >
              {/* Poste de madera rústica */}
              <rect
                x="108"
                y="140"
                width="24"
                height="90"
                rx="4"
                fill="#8A6B53"
              />
              <rect
                x="112"
                y="140"
                width="6"
                height="90"
                fill="#6E523D"
                opacity="0.5"
              />

              {/* Soporte horizontal */}
              <path
                d="M80 145 L160 145 L150 155 L90 155 Z"
                fill="#5C4432"
              />

              {/* Cuerpo del buzón en azul cielo pastel */}
              <rect
                x="45"
                y="50"
                width="150"
                height="90"
                rx="45"
                fill="#89B8E6"
              />
              {/* Domo del buzón con luz de degradado */}
              <path
                d="M45 95 C45 70 65 50 90 50 L150 50 C175 50 195 70 195 95 L45 95 Z"
                fill="#A4C9EE"
              />

              {/* Banderín en tono rose suave */}
              <line
                x1="180"
                y1="100"
                x2="210"
                y2="60"
                stroke="#C76D80"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M210 60 L230 65 L210 75 Z"
                fill="#C76D80"
              />

              {/* Ranura y puerta frontal */}
              <ellipse
                cx="80"
                cy="95"
                rx="30"
                ry="40"
                fill="#6B9BC9"
              />
              <ellipse
                cx="80"
                cy="95"
                rx="26"
                ry="36"
                fill="#4D80AF"
              />

              {/* Puerta frontal con pestillo */}
              <ellipse
                cx="80"
                cy="95"
                rx="24"
                ry="33"
                fill="#80AEDD"
              />

              {/* Placa metálica dorada de la puerta */}
              <circle cx="80" cy="95" r="9" fill="#E5BE73" />
              <circle cx="80" cy="95" r="7" fill="#996F2E" opacity="0.3" />
              <path
                d="M80 91 C78 88 74 90 75 93 C76 96 80 99 80 99 C80 99 84 96 85 93 C86 90 82 88 80 91 Z"
                fill="#FFFFFF"
              />

              {/* Ranura de cartas superior */}
              <rect
                x="95"
                y="70"
                width="50"
                height="4"
                rx="2"
                fill="#4D80AF"
              />
            </svg>
          </div>

          <p className="font-serif italic text-sky-900/80 text-xs mt-2 text-center max-w-[220px]">
            «Frente al buzón de nuestra historia»
          </p>
        </div>

        {/* ========================================================================= */}
        {/* LADO DERECHO: FORMULARIO DE ACCESO INTEGRADO COMO PLACA DEL BUZÓN */}
        {/* ========================================================================= */}
        <div className="w-full max-w-[390px] bg-white/95 backdrop-blur-sm rounded-[24px] shadow-letter p-7 sm:p-9 text-center border border-sky-200/80 animate-fade-up">
          {/* Logo Oficial de Nuestras Aventuras */}
          <div className="flex justify-center mb-3">
            <AppLogo size="xl" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-1">
            Nuestras Aventuras
          </h1>
          <p className="text-ink-soft text-xs sm:text-sm leading-relaxed mb-6 font-normal">
            Diario de viajes y cartas de amor.
            <br />
            Identifícate para revisar el buzón.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-blush-50 border border-blush-200 text-ink text-left text-xs flex items-start gap-2 animate-fade-up">
              <AlertCircle size={16} className="text-blush-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Selector de Rol (Sin emojis, usando iconos limpios) */}
            <div className="flex gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => handleRoleChange("novio")}
                className={`flex-1 py-3 px-2 rounded-xl border text-xs sm:text-[13px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === "novio"
                    ? "border-sky-400 bg-sky-100 text-sky-900 shadow-xs"
                    : "border-line text-ink-soft hover:bg-sky-50/50"
                }`}
              >
                <User size={15} className="text-sky-700" />
                <span>Soy Samuel</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange("novia")}
                className={`flex-1 py-3 px-2 rounded-xl border text-xs sm:text-[13px] font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  role === "novia"
                    ? "border-blush-300 bg-blush-100 text-blush-900 shadow-xs"
                    : "border-line text-ink-soft hover:bg-blush-50/50"
                }`}
              >
                <Heart size={15} className="text-blush-500 fill-blush-400" />
                <span>Soy Diana</span>
              </button>
            </div>

            {/* Campo Correo */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
                Correo
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full py-3 px-3.5 pl-10 border border-sky-200/80 rounded-xl font-sans text-sm bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all"
                />
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600 opacity-70"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 px-3.5 pl-10 border border-sky-200/80 rounded-xl font-sans text-sm bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all"
                />
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600 opacity-70"
                />
              </div>
            </div>

            {/* Botón de Entrada */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || isZoomingOut}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-sm py-3.5 px-5 rounded-xl hover:shadow-md transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Abriendo correspondencia...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar al buzón</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
