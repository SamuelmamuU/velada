"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse, RolUsuario } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Mailbox3DParticles } from "@/components/mailbox/Mailbox3DParticles";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { Seal } from "@/components/ui/Seal";
import { AppLogo } from "@/components/ui/AppLogo";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  User,
  Heart,
  ArrowRight,
  Sparkles,
  QrCode,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type MailboxStage =
  | "lateral_login"
  | "rotating_to_front"
  | "front_closed"
  | "door_opening"
  | "letters_floating"
  | "letter_expanded"
  | "docking"
  | "minimized_widget";

interface Mailbox3DExperienceProps {
  initialStage?: MailboxStage;
  pendingCitas?: ICitaResponse[];
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  onCloseToDashboard?: () => void;
  isLoginScreen?: boolean;
}

export function Mailbox3DExperience({
  initialStage = "lateral_login",
  pendingCitas = [],
  onCitaUpdated,
  onCloseToDashboard,
  isLoginScreen = false,
}: Mailbox3DExperienceProps) {
  const { login, register } = useAuth();

  // Estado del ciclo de vida del buzón 3D
  const [stage, setStage] = useState<MailboxStage>(initialStage);
  const [selectedLetter, setSelectedLetter] = useState<ICitaResponse | null>(null);
  const [activeEnvelopeIndex, setActiveEnvelopeIndex] = useState(0);

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);

  // Estados del formulario en la cara lateral
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<RolUsuario>("novia");
  const [email, setEmail] = useState("novia@velada.app");
  const [password, setPassword] = useState("NoviaVelada2026!");

  // Registro en la cara lateral
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<RolUsuario>("novia");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Actualizar rol y credenciales de prueba
  const handleRoleChange = (selectedRole: RolUsuario) => {
    setRole(selectedRole);
    setAuthError(null);
    if (selectedRole === "novio") {
      setEmail("novio@velada.app");
      setPassword("NovioVelada2026!");
    } else {
      setEmail("novia@velada.app");
      setPassword("NoviaVelada2026!");
    }
  };

  // Manejar Login en la cara lateral del Buzón 3D
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Por favor completa tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await login(email, password, {
        delayCommitMs: 1350,
        onPreCommit: () => {
          // Iniciar animación: el buzón se aleja un poco y rota de perfil hacia el frente
          setStage("rotating_to_front");
          try {
            sessionStorage.setItem("mailbox_auto_open", "true");
            sessionStorage.setItem("mailbox_stage", "front_closed");
          } catch {}
        },
      });
      if (!res.success) {
        setAuthError(res.error || "No se pudo iniciar sesión. Revisa tus credenciales.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setAuthError("Error de comunicación con el servidor.");
      setAuthLoading(false);
    }
  };

  // Manejar Registro en la cara lateral
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regEmail || !regPassword) {
      setAuthError("Completa todos los datos para crear tu buzón.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await register(
        {
          nombre: regNombre,
          email: regEmail,
          password: regPassword,
          rol: regRole,
        },
        {
          delayCommitMs: 1350,
          onPreCommit: () => {
            setStage("rotating_to_front");
            try {
              sessionStorage.setItem("mailbox_auto_open", "true");
              sessionStorage.setItem("mailbox_stage", "front_closed");
            } catch {}
          },
        }
      );

      if (!res.success) {
        setAuthError(res.error || "No se pudo registrar la cuenta.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setAuthError("Error al registrar perfil.");
      setAuthLoading(false);
    }
  };

  // Al hacer click en la puerta del buzón
  const handleDoorClick = () => {
    if (stage === "front_closed") {
      setStage("door_opening");
      setTimeout(() => {
        setStage("letters_floating");
      }, 700);
    } else if (stage === "door_opening" || stage === "letters_floating") {
      setStage("front_closed");
    }
  };

  // Al hacer click en un sobre flotante
  const handleEnvelopeClick = (cita: ICitaResponse) => {
    setSelectedLetter(cita);
    setStage("letter_expanded");
  };

  // Al cerrar o contestar la carta
  const handleCloseExpandedLetter = () => {
    setSelectedLetter(null);
    setStage("docking");
    setTimeout(() => {
      setStage("minimized_widget");
      onCloseToDashboard?.();
    }, 900);
  };

  // Restaurar buzón desde el widget minimizado
  const handleRestoreFromWidget = () => {
    setStage("front_closed");
  };

  // Transformación 3D según el stage
  const getMailbox3DTransform = () => {
    switch (stage) {
      case "lateral_login":
        // Vista lateral 3D enfocada en la cara del login
        return {
          rotateY: 64,
          rotateX: 3,
          scale: 1,
          translateZ: 0,
          x: 0,
          y: 0,
        };
      case "rotating_to_front":
        // Se aleja un poco y se pone de frente a la cámara
        return {
          rotateY: 0,
          rotateX: 0,
          scale: 0.92,
          translateZ: -90,
          x: 0,
          y: 0,
        };
      case "front_closed":
      case "door_opening":
      case "letters_floating":
        // De frente a la cámara viendo la puerta
        return {
          rotateY: 0,
          rotateX: 2,
          scale: 1,
          translateZ: 0,
          x: 0,
          y: 0,
        };
      case "letter_expanded":
        return {
          rotateY: -6,
          rotateX: 0,
          scale: 0.85,
          translateZ: -120,
          x: 0,
          y: 0,
        };
      case "docking":
        return {
          rotateY: 15,
          rotateX: 5,
          scale: 0.28,
          translateZ: 0,
          x: "36vw",
          y: "36vh",
        };
      case "minimized_widget":
        return {
          rotateY: 15,
          rotateX: 5,
          scale: 0.28,
          translateZ: 0,
          x: 0,
          y: 0,
        };
      default:
        return {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          translateZ: 0,
          x: 0,
          y: 0,
        };
    }
  };

  const isDoorOpen =
    stage === "door_opening" ||
    stage === "letters_floating" ||
    stage === "letter_expanded";

  const hasUnreadLetters = pendingCitas.length > 0;

  // Si está minimizado como widget interactivo en la esquina
  if (stage === "minimized_widget") {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-up select-none">
        <motion.button
          type="button"
          onClick={handleRestoreFromWidget}
          whileHover={{ scale: 1.08, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          className="group relative flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 pr-4 rounded-2xl shadow-letter border border-sky-200/90 text-left cursor-pointer transition-all hover:shadow-xl hover:border-sky-300"
          title="Abrir Buzón 3D de Nuestras Aventuras"
        >
          {/* Miniatura del buzón con banderín y resplandor */}
          <div className="relative w-12 h-12 flex-shrink-0 bg-sky-100/70 rounded-xl flex items-center justify-center overflow-hidden border border-sky-200">
            <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-xs">
              <rect x="46" y="60" width="8" height="35" rx="2" fill="#8A6B53" />
              <rect x="20" y="30" width="60" height="36" rx="18" fill="#89B8E6" />
              <path
                d="M 20 48 C 20 38 28 30 38 30 L 62 30 C 72 30 80 38 80 48 Z"
                fill="#A4C9EE"
              />
              <ellipse cx="35" cy="48" rx="11" ry="15" fill="#6B9BC9" />
              <circle cx="35" cy="48" r="3.5" fill="#E5BE73" />
              <line x1="72" y1="48" x2="84" y2="30" stroke="#C76D80" strokeWidth="2.5" />
              <path d="M 84 30 L 92 32 L 84 37 Z" fill="#C76D80" />
            </svg>

            {hasUnreadLetters && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-handwriting text-base font-bold text-sky-950 leading-tight">
                Samuel & Diana
              </span>
              {hasUnreadLetters && (
                <span className="bg-blush-100 text-blush-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-blush-200 font-mono">
                  {pendingCitas.length}
                </span>
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700/80">
              {hasUnreadLetters ? "Cartas pendientes" : "Buzón al día"}
            </p>
          </div>

          <Maximize2
            size={14}
            className="text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
          />
        </motion.button>
      </div>
    );
  }

  return (
    <div
      className={
        isLoginScreen
          ? "relative w-full min-h-[90vh] flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden"
          : `fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden transition-all duration-700 ${
              stage === "docking"
                ? "bg-transparent backdrop-blur-none pointer-events-none"
                : "bg-[#132233]/70 backdrop-blur-md"
            }`
      }
    >
      {/* Three.js Canvas de partículas ambientales en el fondo */}
      <Mailbox3DParticles count={45} className="opacity-90" />

      {/* Botón superior de cerrar / saltar al dashboard si no es login */}
      {!isLoginScreen && stage !== "lateral_login" && (
        <button
          type="button"
          onClick={() => {
            setStage("docking");
            setTimeout(() => {
              setStage("minimized_widget");
              onCloseToDashboard?.();
            }, 900);
          }}
          className="fixed top-5 right-5 z-40 p-2.5 rounded-full bg-white/90 hover:bg-white text-ink-soft hover:text-ink shadow-md transition-transform hover:scale-105 cursor-pointer border border-sky-100"
          title="Minimizar buzón e ir al tablero"
        >
          <X size={18} />
        </button>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 3D PRINCIPAL (CSS 3D TRANSFORMS + THREE.JS STARS) */}
      {/* ========================================================================= */}
      <div
        className="relative w-full max-w-5xl flex items-center justify-center select-none"
        style={{ perspective: "1400px" }}
      >
        {/* Contenedor del Buzón en el Espacio 3D */}
        <motion.div
          animate={getMailbox3DTransform()}
          transition={{
            duration: stage === "rotating_to_front" ? 1.25 : 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
          className="relative flex items-center justify-center"
        >
          {/* Sombra de contacto suave en el piso */}
          <div
            className="absolute -bottom-24 w-80 h-16 bg-sky-950/15 rounded-full blur-xl pointer-events-none -z-20"
            style={{
              transform: "rotateX(75deg) translateZ(-80px)",
            }}
          />

          {/* ===================================================================== */}
          {/* CUERPO DEL BUZÓN 3D (Arquitrave, Poste, Domo, Puerta y Banderín) */}
          {/* ===================================================================== */}
          <div
            className="relative w-[340px] sm:w-[400px] h-[340px] flex items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Poste de Madera Rústica Inferior */}
            <div
              className="absolute -bottom-28 w-10 h-36 bg-[#8A6B53] rounded-sm shadow-md flex flex-col justify-between"
              style={{
                transform: "translateZ(-40px)",
                backgroundImage:
                  "linear-gradient(90deg, #6E523D 0%, #8A6B53 30%, #9B795F 70%, #5C4432 100%)",
              }}
            >
              <div className="w-full h-3 bg-[#5C4432]/40" />
              <div className="w-full h-3 bg-[#5C4432]/40" />
            </div>

            {/* Soporte transversal */}
            <div
              className="absolute -bottom-4 w-44 h-4 bg-[#5C4432] rounded-xs shadow-sm"
              style={{ transform: "translateZ(-35px)" }}
            />

            {/* Banderín Postal Rojo/Coral en el costado derecho */}
            <motion.div
              animate={{
                rotate: hasUnreadLetters ? [0, -3, 0] : 85,
                y: hasUnreadLetters ? [0, -2, 0] : 10,
              }}
              transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              className="absolute top-14 -right-10 origin-bottom-left z-20 cursor-pointer pointer-events-auto"
              style={{
                transform: "translateZ(-20px)",
              }}
              title={
                hasUnreadLetters
                  ? `${pendingCitas.length} carta(s) esperando por ti`
                  : "Sin cartas nuevas"
              }
            >
              <div className="w-2.5 h-24 bg-[#B54A60] rounded-full shadow-md flex flex-col justify-between items-center py-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#E5BE73] border border-[#B54A60] shadow-xs mt-auto mb-1" />
              </div>
              <div className="absolute top-0 right-0 w-12 h-8 bg-gradient-to-r from-[#D8586E] to-[#C7455B] rounded-r-md shadow-md flex items-center justify-center text-white">
                <Heart size={12} className="fill-white" />
              </div>
            </motion.div>

            {/* Túnel / Cascarón del Buzón 3D */}
            <div
              className="relative w-full h-[240px] rounded-t-[120px] rounded-b-[20px] shadow-2xl overflow-hidden border-2 border-sky-300/60"
              style={{
                background:
                  "linear-gradient(145deg, #A8CDEF 0%, #89B8E6 45%, #6B9BC9 100%)",
                boxShadow:
                  "inset 0 10px 25px rgba(255,255,255,0.4), 0 25px 40px rgba(20,50,90,0.3)",
              }}
            >
              {/* Brillo curvo del domo metálico */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white/35 to-transparent rounded-t-[120px]" />

              {/* Interior del Buzón */}
              <div
                className={`absolute inset-4 rounded-t-[105px] rounded-b-[12px] bg-gradient-to-b from-[#1E334D] via-[#152538] to-[#0D1824] border border-sky-900/60 flex flex-col items-center justify-center transition-all duration-700 ${
                  isDoorOpen ? "opacity-100 shadow-inner" : "opacity-0"
                }`}
              >
                <div className="absolute inset-0 bg-radial from-amber-200/25 via-sky-300/10 to-transparent blur-md" />

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Mail size={32} className="text-amber-200/80 animate-pulse mb-1" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-amber-200/70">
                    {pendingCitas.length > 0
                      ? `${pendingCitas.length} Correspondencia(s)`
                      : "Buzón vacío"}
                  </span>
                </div>
              </div>

              {/* ================================================================= */}
              {/* PUERTA FRONTAL BASCULANTE */}
              {/* ================================================================= */}
              <motion.div
                onClick={handleDoorClick}
                animate={{
                  rotateX: isDoorOpen ? -118 : 0,
                  y: isDoorOpen ? 12 : 0,
                }}
                transition={{
                  duration: 0.75,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  transformOrigin: "bottom center",
                  transformStyle: "preserve-3d",
                }}
                className={`absolute inset-0 rounded-t-[120px] rounded-b-[20px] flex flex-col items-center justify-center cursor-pointer border-2 border-sky-200/80 transition-colors ${
                  stage === "front_closed"
                    ? "hover:brightness-105 active:scale-[0.99]"
                    : ""
                }`}
              >
                <div
                  className="absolute inset-0 rounded-t-[118px] rounded-b-[18px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #99C5F0 0%, #7EAAD9 60%, #6392C2 100%)",
                  }}
                />

                {/* Ranura de cartas superior */}
                <div className="relative z-10 w-44 h-4 bg-[#4A79A6] rounded-full border border-sky-900/30 shadow-inner flex items-center justify-center mb-8">
                  <div className="w-36 h-1 bg-sky-950/40 rounded-full" />
                </div>

                {/* Manija / Pestillo redondo dorado */}
                <div className="relative z-10 flex flex-col items-center group">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F2D18B] to-[#C99C44] p-1 shadow-lg border border-[#FFE7A8] flex items-center justify-center transition-transform group-hover:scale-105">
                    <div className="w-11 h-11 rounded-full bg-[#E5BE73] shadow-inner flex items-center justify-center">
                      <Heart size={18} className="fill-white text-white drop-shadow-xs" />
                    </div>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/90 font-bold mt-2 drop-shadow-xs">
                    {isDoorOpen ? "Cerrar" : "Tocar para abrir"}
                  </span>
                </div>

                <div className="absolute inset-2 rounded-t-[110px] rounded-b-[14px] border border-white/30 pointer-events-none" />
              </motion.div>
            </div>

            {/* Hint flotante de invitación a tocar la puerta */}
            {stage === "front_closed" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -bottom-16 z-30 flex flex-col items-center pointer-events-none"
              >
                <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-5 py-2 rounded-full shadow-lg border border-sky-100 flex items-center gap-2">
                  <Heart size={14} className="fill-blush-400 text-blush-400 animate-ping" />
                  <span>Toca la puerta del buzón para abrirlo</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* CARA LATERAL DEL BUZÓN 3D: LOGIN + NOMBRES PINTADOS SAMUEL Y DIANA */}
          {/* ===================================================================== */}
          <div
            className={`absolute z-30 transition-all duration-700 ${
              stage === "lateral_login"
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
            style={{
              transform:
                "translateX(180px) translateZ(120px) rotateY(-40deg)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="w-[340px] sm:w-[390px] flex flex-col items-center select-text">
              {/* PLACA SUPERIOR: NOMBRES PINTADOS A MANO "SAMUEL Y DIANA" */}
              <div className="relative mb-3 flex flex-col items-center select-none w-full">
                <svg
                  className="absolute -inset-x-6 -inset-y-3 w-[calc(100%+48px)] h-[calc(100%+24px)] text-white/95 drop-shadow-md -z-10"
                  viewBox="0 0 280 60"
                  fill="currentColor"
                  preserveAspectRatio="none"
                >
                  <path d="M 12 18 Q 80 4 140 10 Q 210 5 268 16 Q 275 35 260 48 Q 180 56 120 50 Q 50 55 10 42 Q 4 28 12 18 Z" />
                </svg>

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
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-sky-700/80 block mt-0.5 font-bold">
                    Cara Lateral · Buzón de Nuestras Aventuras
                  </span>
                </div>
              </div>

              {/* FORMULARIO DE LOGIN INTEGRADO A LA CARA LATERAL */}
              <div className="w-full bg-white/95 backdrop-blur-md rounded-[24px] shadow-letter p-6 sm:p-7 text-center border border-sky-200/90 animate-fade-up">
                <div className="flex justify-center mb-2">
                  <AppLogo size="lg" />
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight mb-1">
                  {authMode === "login" ? "Acceso al Buzón" : "Crear Perfil"}
                </h2>
                <p className="text-ink-soft text-xs mb-4 font-normal">
                  {authMode === "login"
                    ? "Inicia sesión para revisar tus cartas."
                    : "Crea tu cuenta y conéctate por código QR."}
                </p>

                {/* Selector Modo Login / Registro */}
                <div className="flex p-1 bg-sky-100/70 rounded-xl mb-4 border border-sky-200/70">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      authMode === "login"
                        ? "bg-white text-sky-950 shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      authMode === "register"
                        ? "bg-white text-sky-950 shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Crear Perfil QR
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-2.5 rounded-xl bg-blush-50 border border-blush-200 text-ink text-left text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="text-blush-500 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => handleRoleChange("novio")}
                        className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === "novio"
                            ? "border-sky-400 bg-sky-100 text-sky-900 shadow-xs"
                            : "border-line text-ink-soft hover:bg-sky-50/50"
                        }`}
                      >
                        <User size={13} className="text-sky-700" />
                        <span>Samuel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange("novia")}
                        className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === "novia"
                            ? "border-blush-300 bg-blush-100 text-blush-900 shadow-xs"
                            : "border-line text-ink-soft hover:bg-blush-50/50"
                        }`}
                      >
                        <Heart size={13} className="text-blush-500 fill-blush-400" />
                        <span>Diana</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1">
                        Correo
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="w-full py-2.5 px-3 pl-9 border border-sky-200/80 rounded-xl font-sans text-xs bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all"
                        />
                        <Mail
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600 opacity-70"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full py-2.5 px-3 pl-9 border border-sky-200/80 rounded-xl font-sans text-xs bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all"
                        />
                        <Lock
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-600 opacity-70"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs py-3 px-4 rounded-xl hover:shadow-md transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Entrando al buzón...</span>
                          </>
                        ) : (
                          <>
                            <span>Entrar al buzón</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3 text-left">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        placeholder="ej. Samuel, Diana..."
                        className="w-full py-2 px-3 border border-sky-200/80 rounded-xl font-sans text-xs bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1">
                        Correo
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full py-2 px-3 border border-sky-200/80 rounded-xl font-sans text-xs bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full py-2 px-3 border border-sky-200/80 rounded-xl font-sans text-xs bg-sky-50/30 text-ink focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <QrCode size={14} />
                            <span>Crear Buzón y Código QR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===================================================================== */}
        {/* SOBRES DE CARTAS FLOTANDO EN 3D FRENTE A LA PUERTA ABIERTA */}
        {/* ===================================================================== */}
        <AnimatePresence>
          {stage === "letters_floating" && (
            <motion.div
              key="floating-envelopes"
              initial={{ opacity: 0, scale: 0.6, z: -100 }}
              animate={{ opacity: 1, scale: 1, z: 80 }}
              exit={{ opacity: 0, scale: 0.7, z: -50 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-40 flex flex-col items-center justify-center pointer-events-auto"
              style={{
                transform: "translateZ(140px)",
              }}
            >
              {pendingCitas.length > 0 ? (
                <div className="flex flex-col items-center">
                  {pendingCitas.length > 1 && (
                    <div className="flex items-center gap-2 mb-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-sky-100">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveEnvelopeIndex((prev) =>
                            prev > 0 ? prev - 1 : pendingCitas.length - 1
                          )
                        }
                        className="p-1 rounded-full hover:bg-sky-100 text-sky-900 transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="font-mono text-xs font-semibold text-sky-900">
                        {activeEnvelopeIndex + 1} de {pendingCitas.length} cartas
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveEnvelopeIndex((prev) =>
                            prev < pendingCitas.length - 1 ? prev + 1 : 0
                          )
                        }
                        className="p-1 rounded-full hover:bg-sky-100 text-sky-900 transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {(() => {
                    const cita = pendingCitas[activeEnvelopeIndex] || pendingCitas[0];
                    return (
                      <motion.div
                        key={cita.id}
                        animate={{
                          y: [0, -12, 0],
                          rotate: [-1.2, 1.2, -1.2],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 3.5,
                          ease: "easeInOut",
                        }}
                        whileHover={{ scale: 1.05, y: -16 }}
                        onClick={() => handleEnvelopeClick(cita)}
                        className="group relative w-[290px] sm:w-[330px] h-[200px] sm:h-[220px] bg-[#FAF7F0] rounded-2xl shadow-2xl p-5 border border-[#E8DFC8] cursor-pointer flex flex-col justify-between select-none transition-all hover:shadow-[0_20px_40px_rgba(20,50,90,0.35)]"
                      >
                        <div
                          className="absolute inset-1.5 rounded-xl pointer-events-none opacity-40"
                          style={{
                            border: "1px dashed #C9A96E",
                          }}
                        />

                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A8150] block">
                              Correspondencia Especial
                            </span>
                            <span className="font-serif italic text-xs text-ink-soft">
                              Nuestras Aventuras
                            </span>
                          </div>

                          <div className="w-10 h-12 border-2 border-dashed border-[#C9A96E] bg-sky-50 rounded-sm flex flex-col items-center justify-center p-1 shadow-xs">
                            <Heart size={14} className="fill-blush-400 text-blush-500" />
                            <span className="font-mono text-[7px] text-sky-900 font-bold mt-1">
                              2026
                            </span>
                          </div>
                        </div>

                        <div className="self-center my-auto flex flex-col items-center">
                          <Seal size="md" className="group-hover:scale-110 transition-transform shadow-md" />
                          <p className="font-handwriting text-2xl text-sky-950 font-bold mt-2">
                            {cita.nombre}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#E8DFC8]/60 pt-2 text-[11px] text-ink-soft font-mono">
                          <span>Para: Diana</span>
                          <span>
                            {format(new Date(cita.horario), "d 'de' MMMM", { locale: es })}
                          </span>
                        </div>

                        <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                          <span className="bg-sky-700 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md group-hover:bg-sky-800 transition-colors flex items-center gap-1.5 font-sans">
                            <Sparkles size={11} />
                            <span>Toca para desplegar la carta</span>
                          </span>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-xl text-center max-w-sm">
                  <Heart size={28} className="fill-sky-400 text-sky-500 mx-auto mb-2" />
                  <h3 className="font-serif font-bold text-lg text-ink">Buzón al día</h3>
                  <p className="text-xs text-ink-soft mt-1">
                    No tienes cartas pendientes por responder. Puedes revisar tu historial completo en el tablero.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseExpandedLetter}
                    className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                  >
                    Ir al Tablero Principal
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* VISTA DESPLEGADA DE LA CARTA (3 PESTAÑAS: CARTA, MAPA, POLAROID) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {stage === "letter_expanded" && selectedLetter && (
          <motion.div
            key="expanded-letter-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#132233]/70 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl my-auto">
              <LoveLetterView
                cita={selectedLetter}
                onClose={handleCloseExpandedLetter}
                onCitaUpdated={(updated) => {
                  onCitaUpdated?.(updated);
                  setSelectedLetter(updated);
                }}
                showCloseButton={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
