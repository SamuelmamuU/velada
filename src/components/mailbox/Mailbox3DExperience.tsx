"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse, RolUsuario } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Mailbox3DParticles } from "@/components/mailbox/Mailbox3DParticles";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { Seal } from "@/components/ui/Seal";
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
  Compass,
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

  // Estados del formulario en la etiqueta adhesiva lateral
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<RolUsuario>("novia");
  const [email, setEmail] = useState("novia@velada.app");
  const [password, setPassword] = useState("NoviaVelada2026!");

  // Registro en la etiqueta adhesiva
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<RolUsuario>("novia");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Selector rápido de credenciales de prueba
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

  // Enviar login desde la etiqueta adhesiva del costado del buzón
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
        delayCommitMs: 1400,
        onPreCommit: () => {
          // El buzón se aleja un poco y rota de perfil hacia el frente de la cámara
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

  // Enviar registro desde la etiqueta adhesiva
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
          delayCommitMs: 1400,
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

  // Clic en la puerta frontal del buzón
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

  // Clic en un sobre flotante
  const handleEnvelopeClick = (cita: ICitaResponse) => {
    setSelectedLetter(cita);
    setStage("letter_expanded");
  };

  // Cerrar o contestar carta: repliegue y guardado hacia el tablero
  const handleCloseExpandedLetter = () => {
    setSelectedLetter(null);
    setStage("docking");
    setTimeout(() => {
      setStage("minimized_widget");
      onCloseToDashboard?.();
    }, 950);
  };

  // Restaurar buzón al centro desde el widget miniatura
  const handleRestoreFromWidget = () => {
    setStage("front_closed");
  };

  // Transformación 3D del Buzón según la etapa
  const getMailbox3DTransform = () => {
    switch (stage) {
      case "lateral_login":
        // Vista lateral 3D enfocada directamente en la cara del buzón con la etiqueta
        return {
          rotateY: -72,
          rotateX: 3,
          rotateZ: 0,
          scale: 0.98,
          translateZ: 20,
          x: 40,
          y: 0,
        };
      case "rotating_to_front":
        // Se aleja en perspectiva y rota con suavidad hacia el frente
        return {
          rotateY: 0,
          rotateX: 2,
          rotateZ: 0,
          scale: 0.88,
          translateZ: -110,
          x: 0,
          y: 0,
        };
      case "front_closed":
      case "door_opening":
      case "letters_floating":
        // Frente a la cámara viendo la puerta y banderín
        return {
          rotateY: 0,
          rotateX: 3,
          rotateZ: 0,
          scale: 1,
          translateZ: 0,
          x: 0,
          y: 0,
        };
      case "letter_expanded":
        return {
          rotateY: -6,
          rotateX: 1,
          rotateZ: 0,
          scale: 0.82,
          translateZ: -140,
          x: 0,
          y: 0,
        };
      case "docking":
        return {
          rotateY: 18,
          rotateX: 6,
          rotateZ: 0,
          scale: 0.26,
          translateZ: 0,
          x: "38vw",
          y: "36vh",
        };
      case "minimized_widget":
        return {
          rotateY: 18,
          rotateX: 6,
          rotateZ: 0,
          scale: 0.26,
          translateZ: 0,
          x: 0,
          y: 0,
        };
      default:
        return {
          rotateY: 0,
          rotateX: 0,
          rotateZ: 0,
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

  // Si está minimizado como widget interactivo en la esquina inferior derecha
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
          {/* Miniatura 3D del buzón */}
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
          ? "relative w-full min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden"
          : `fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden transition-all duration-700 ${
              stage === "docking"
                ? "bg-transparent backdrop-blur-none pointer-events-none"
                : "bg-[#101D2B]/75 backdrop-blur-md"
            }`
      }
    >
      {/* Three.js Canvas de partículas ambientales en el fondo */}
      <Mailbox3DParticles count={40} className="opacity-90" />

      {/* Botón superior de cerrar hacia el dashboard */}
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
      {/* ESCENA 3D PRINCIPAL CON VOLUMEN FÍSICO REAL (CSS 3D PRESERVE-3D) */}
      {/* ========================================================================= */}
      <div
        className="relative w-full max-w-5xl flex items-center justify-center select-none"
        style={{ perspective: "1500px" }}
      >
        {/* Contenedor del Buzón 3D Volumétrico */}
        <motion.div
          animate={getMailbox3DTransform()}
          transition={{
            duration: stage === "rotating_to_front" ? 1.35 : 0.85,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
          className="relative flex items-center justify-center"
        >
          {/* Sombra de contacto volumétrica en el suelo */}
          <div
            className="absolute -bottom-32 w-[480px] h-28 bg-[#091522]/35 rounded-full blur-2xl pointer-events-none -z-30"
            style={{
              transform: "rotateX(85deg) translateZ(-90px)",
            }}
          />

          {/* ===================================================================== */}
          {/* ESTRUCTURA VOLUMÉTRICA 3D DEL BUZÓN POSTAL */}
          {/* Ancho Frontal: 310px | Alto: 230px | Profundidad Z: 440px */}
          {/* ===================================================================== */}
          <div
            className="relative w-[310px] h-[230px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* POSTE DE MADERA 3D (4 Caras con veta y sombra) */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-[190px] w-12 h-48 pointer-events-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Cara Frontal del Poste */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#7A5A41] via-[#654731] to-[#4F3624] border-x border-[#553C29] shadow-md"
                style={{ transform: "translateZ(6px)" }}
              />
              {/* Cara Lateral Derecha del Poste */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#654731] to-[#3D291B]"
                style={{
                  transform: "rotateY(90deg) translateZ(6px)",
                  width: "12px",
                }}
              />
              {/* Cara Lateral Izquierda del Poste */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#8C684C] to-[#553C29]"
                style={{
                  transform: "rotateY(-90deg) translateZ(6px)",
                  width: "12px",
                }}
              />
              {/* Soporte transversal bajo el buzón */}
              <div
                className="absolute -top-3 -left-12 w-36 h-4 bg-[#553C29] rounded-xs shadow-sm border border-[#3D291B]"
                style={{ transform: "translateZ(6px)" }}
              />
            </div>

            {/* BASE INFERIOR DE CHAPA METÁLICA (Piso del Buzón) */}
            <div
              className="absolute left-0 top-[115px] w-[310px] h-[440px] pointer-events-none"
              style={{
                transform: "rotateX(-90deg) translateZ(115px)",
                background:
                  "linear-gradient(180deg, #2A435A 0%, #1D3245 60%, #152433 100%)",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)",
              }}
            />

            {/* PARED TRASERA DEL BUZÓN (Fondo ciego con remates) */}
            <div
              className="absolute inset-0 rounded-t-[155px] pointer-events-none border-t border-sky-300/40"
              style={{
                transform: "rotateY(180deg) translateZ(220px)",
                background:
                  "linear-gradient(180deg, #6B9BC9 0%, #5280AD 60%, #3B648C 100%)",
                boxShadow: "inset 0 10px 30px rgba(0,0,0,0.3)",
              }}
            />

            {/* DOMO CILÍNDRICO CURVO 3D (Lamas continuas longitudinales) */}
            {/* Slat 1 - Arista Izquierda */}
            <div
              className="absolute -left-1 -top-1 w-[80px] h-[440px] origin-top-left pointer-events-none"
              style={{
                transform:
                  "rotateY(90deg) rotateX(-50deg) translateX(-220px) translateY(-25px)",
                background:
                  "linear-gradient(90deg, #4A77A1 0%, #6896C2 60%, #7EA8D4 100%)",
              }}
            />
            {/* Slat 2 - Corona Superior con Brillo Especular de Metal */}
            <div
              className="absolute left-0 -top-[35px] w-[310px] h-[440px] pointer-events-none"
              style={{
                transform: "rotateX(-90deg) translateZ(-35px)",
                background:
                  "linear-gradient(90deg, #6292BE 0%, #8EB6E0 25%, #C2DCF7 50%, #8EB6E0 75%, #5887B3 100%)",
                boxShadow: "0 0 25px rgba(255,255,255,0.25)",
              }}
            />
            {/* Slat 3 - Arista Derecha */}
            <div
              className="absolute -right-1 -top-1 w-[80px] h-[440px] origin-top-right pointer-events-none"
              style={{
                transform:
                  "rotateY(-90deg) rotateX(-50deg) translateX(220px) translateY(-25px)",
                background:
                  "linear-gradient(90deg, #7EA8D4 0%, #6896C2 40%, #4A77A1 100%)",
              }}
            />

            {/* BANDERÍN POSTAL ROJO EN EL COSTADO DERECHO */}
            <motion.div
              animate={{
                rotate: hasUnreadLetters ? [0, -3, 0] : 85,
                y: hasUnreadLetters ? [0, -2, 0] : 10,
              }}
              transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
              className="absolute top-10 -right-4 origin-bottom-left z-30 pointer-events-auto cursor-pointer"
              style={{
                transform: "translateZ(90px)",
              }}
              title={
                hasUnreadLetters
                  ? `${pendingCitas.length} carta(s) esperando por ti`
                  : "Sin cartas nuevas"
              }
            >
              {/* Mástil de metal esmaltado */}
              <div className="w-2.5 h-28 bg-[#C24157] rounded-full shadow-md flex flex-col justify-between items-center py-1 border border-[#9E2A3E]">
                <div className="w-4 h-4 rounded-full bg-gradient-to-b from-[#F3D188] to-[#BA882F] border border-[#FFE19E] shadow-xs mt-auto mb-0.5" />
              </div>
              {/* Bandera con flecha clásica postal */}
              <div className="absolute top-0 right-0 w-14 h-9 bg-gradient-to-r from-[#E04D65] to-[#C9334D] rounded-r-md shadow-lg flex items-center justify-center text-white border-y border-r border-[#F07A8F]">
                <Heart size={14} className="fill-white drop-shadow-xs" />
              </div>
            </motion.div>

            {/* ================================================================= */}
            {/* COSTADO LATERAL IZQUIERDO DEL BUZÓN (Cara Opuesta) */}
            {/* ================================================================= */}
            <div
              className="absolute top-0 left-0 w-[440px] h-[230px] rounded-tl-[155px] pointer-events-none border-t border-sky-300/50"
              style={{
                transform: "rotateY(-90deg) translateZ(155px)",
                background:
                  "linear-gradient(180deg, #72A0CC 0%, #5C8BB8 45%, #46739E 100%)",
                boxShadow: "inset 0 15px 30px rgba(255,255,255,0.2)",
              }}
            />

            {/* ================================================================= */}
            {/* COSTADO LATERAL DERECHO DEL BUZÓN 3D */}
            {/* AQUÍ ESTÁN LITERALMENTE ESCRITOS "SAMUEL Y DIANA" EN LA PINTURA */}
            {/* Y LA ETIQUETA ADHESIVA DE ACCESO PEGADA DIRECTAMENTE AL METAL */}
            {/* ================================================================= */}
            <div
              className="absolute top-0 left-0 w-[440px] h-[230px] rounded-tr-[155px] border-t border-sky-200/60 flex flex-col justify-between p-3 select-text"
              style={{
                transform: "rotateY(90deg) translateZ(155px)",
                background:
                  "linear-gradient(180deg, #8EB8E2 0%, #76A3D1 25%, #5F8EC0 65%, #4774A3 100%)",
                boxShadow:
                  "inset 0 15px 30px rgba(255,255,255,0.35), inset 0 -15px 25px rgba(15,35,60,0.35)",
              }}
            >
              {/* Textura metálica y remaches en las esquinas */}
              <div className="absolute top-3 left-4 w-2 h-2 rounded-full bg-[#E8C27B] border border-[#8C6F35] shadow-xs pointer-events-none" />
              <div className="absolute top-3 right-4 w-2 h-2 rounded-full bg-[#E8C27B] border border-[#8C6F35] shadow-xs pointer-events-none" />

              {/* =============================================================== */}
              {/* LITERALMENTE ESCRITO EN LA PINTURA DEL BUZÓN: SAMUEL Y DIANA */}
              {/* =============================================================== */}
              <div className="relative z-10 pt-2 pb-1 text-center select-none">
                <div className="inline-block">
                  <h1
                    className="font-handwriting text-4xl sm:text-5xl text-white font-bold tracking-wide leading-none"
                    style={{
                      transform: "rotate(-1.2deg)",
                      textShadow:
                        "0 2px 4px rgba(10,30,55,0.7), 0 0 12px rgba(255,255,255,0.5), -1px -1px 0 rgba(220,240,255,0.8)",
                    }}
                  >
                    Samuel & Diana
                  </h1>
                  <p
                    className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-sky-100 font-bold mt-1"
                    style={{ textShadow: "0 1px 2px rgba(10,30,55,0.8)" }}
                  >
                    Nuestras Aventuras · Buzón del Hogar
                  </p>
                  {/* Trazo de brocha al óleo pintado sobre el metal */}
                  <svg
                    className="w-44 h-2.5 mx-auto mt-0.5 text-white/80 fill-current"
                    viewBox="0 0 180 10"
                  >
                    <path d="M 4 5 Q 50 1 90 5 Q 130 9 176 5 Q 130 7 90 4 Q 50 2 4 5 Z" />
                  </svg>
                </div>
              </div>

              {/* =============================================================== */}
              {/* LA ETIQUETA ADHESIVA DE ACCESO PEGADA AL COSTADO DEL BUZÓN */}
              {/* =============================================================== */}
              <div className="relative z-20 mx-1 mb-1 bg-gradient-to-b from-[#FFFDF7] to-[#F5EEDC] rounded-xl p-3.5 sm:p-4 text-center border-2 border-dashed border-[#D2C5A7] shadow-[0_10px_25px_rgba(10,25,50,0.35)]">
                {/* Cabecera de la Etiqueta Postal */}
                <div className="flex items-center justify-between border-b border-[#E3D8C1] pb-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5 text-left">
                    <Compass size={13} className="text-[#9A7D46]" />
                    <span className="font-mono text-[8.5px] uppercase tracking-wider font-bold text-[#8A6C35]">
                      Etiqueta Postal de Acceso
                    </span>
                  </div>
                  <span className="font-mono text-[8px] text-[#A68F63] font-bold">
                    FOLIO: NA-2026
                  </span>
                </div>

                {/* Selector de modo Login / Registro en la etiqueta */}
                <div className="flex p-0.5 bg-[#ECE3CE] rounded-lg mb-2.5 border border-[#D9CEB5]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      authMode === "login"
                        ? "bg-white text-sky-950 shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Identificarme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                    }}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      authMode === "register"
                        ? "bg-white text-sky-950 shadow-xs"
                        : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    Crear Perfil QR
                  </button>
                </div>

                {authError && (
                  <div className="mb-2.5 p-2 rounded-lg bg-blush-100/90 border border-blush-300 text-ink text-left text-[10.5px] flex items-start gap-1.5">
                    <AlertCircle size={13} className="text-blush-600 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-2 text-left">
                    {/* Sellos de selección de destinatario (Samuel / Diana) */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRoleChange("novio")}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === "novio"
                            ? "border-sky-500 bg-sky-100 text-sky-950 shadow-xs"
                            : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-sky-50/50"
                        }`}
                      >
                        <User size={12} className="text-sky-700" />
                        <span>Samuel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleChange("novia")}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          role === "novia"
                            ? "border-blush-400 bg-blush-100 text-blush-950 shadow-xs"
                            : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-blush-50/50"
                        }`}
                      >
                        <Heart size={12} className="text-blush-500 fill-blush-400" />
                        <span>Diana</span>
                      </button>
                    </div>

                    {/* Campo Correo estilo formulario postal */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                        Correo Postal
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="w-full py-1.5 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                        />
                        <Mail
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                        />
                      </div>
                    </div>

                    {/* Campo Contraseña */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                        Contraseña Secreta
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full py-1.5 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                        />
                        <Lock
                          size={13}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                        />
                      </div>
                    </div>

                    {/* Botón de Entrada estilo Sello */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-sky-700 hover:bg-sky-800 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl hover:shadow-md transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Abriendo cerrojo...</span>
                          </>
                        ) : (
                          <>
                            <span>Timbrar y Entrar al Buzón</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-2 text-left">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        placeholder="ej. Samuel, Diana..."
                        className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                        Correo
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-sky-700 hover:bg-sky-800 text-white font-sans font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {authLoading ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <QrCode size={13} />
                            <span>Crear Buzón y Generar QR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ================================================================= */}
            {/* MARCO FRONTAL Y CAVIDAD INTERIOR ILUMINADA DEL BUZÓN */}
            {/* ================================================================= */}
            <div
              className="absolute inset-0 rounded-t-[155px] pointer-events-none border-2 border-sky-300/80 shadow-2xl"
              style={{
                transform: "translateZ(219px)",
                background:
                  "linear-gradient(180deg, #A2C8EE 0%, #82B0DD 40%, #6899CA 100%)",
              }}
            >
              {/* Cavidad interior del túnel (Visible al abrir la puerta) */}
              <div
                className={`absolute inset-3 rounded-t-[142px] bg-gradient-to-b from-[#182C40] via-[#101E2B] to-[#0A131C] border border-sky-900/80 flex flex-col items-center justify-center transition-all duration-700 ${
                  isDoorOpen ? "opacity-100 shadow-inner" : "opacity-0"
                }`}
              >
                {/* Haz de luz cálida interior */}
                <div className="absolute inset-0 bg-radial from-amber-200/35 via-sky-300/10 to-transparent blur-md" />

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Mail size={36} className="text-amber-200/90 animate-pulse mb-1" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-amber-200/80 font-bold">
                    {pendingCitas.length > 0
                      ? `${pendingCitas.length} Correspondencia(s)`
                      : "Buzón al día"}
                  </span>
                </div>
              </div>
            </div>

            {/* ================================================================= */}
            {/* PUERTA FRONTAL BASCULANTE REALISTA (Bisagra inferior) */}
            {/* ================================================================= */}
            <motion.div
              onClick={handleDoorClick}
              animate={{
                rotateX: isDoorOpen ? -118 : 0,
                y: isDoorOpen ? 14 : 0,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                transformOrigin: "bottom center",
                transformStyle: "preserve-3d",
                transform: "translateZ(221px)",
              }}
              className={`absolute inset-0 rounded-t-[155px] flex flex-col items-center justify-center cursor-pointer border-2 border-sky-200/90 transition-all ${
                stage === "front_closed"
                  ? "hover:brightness-105 active:scale-[0.99]"
                  : ""
              }`}
            >
              {/* Esmalte azul de la puerta */}
              <div
                className="absolute inset-0 rounded-t-[153px]"
                style={{
                  background:
                    "linear-gradient(145deg, #9DC6EE 0%, #7EABE0 40%, #5E8FBF 100%)",
                }}
              />

              {/* Bisagras de latón en la base */}
              <div className="absolute -bottom-1 left-8 w-6 h-3 bg-[#D4AA55] rounded-xs shadow-xs border border-[#8C6B25]" />
              <div className="absolute -bottom-1 right-8 w-6 h-3 bg-[#D4AA55] rounded-xs shadow-xs border border-[#8C6B25]" />

              {/* Ranura de correspondencia superior */}
              <div className="relative z-10 w-44 h-4 bg-[#3E6D99] rounded-full border border-sky-950/40 shadow-inner flex items-center justify-center mb-8">
                <div className="w-36 h-1 bg-sky-950/60 rounded-full" />
              </div>

              {/* Manija de apertura redonda dorada */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#F7DA99] via-[#E2B75A] to-[#B3852C] p-1 shadow-lg border border-[#FFEAB3] flex items-center justify-center transition-transform group-hover:scale-105">
                  <div className="w-11 h-11 rounded-full bg-[#E5BE73] shadow-inner flex items-center justify-center border border-[#CA9B3B]">
                    <Heart size={18} className="fill-white text-white drop-shadow-xs" />
                  </div>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/95 font-bold mt-2 drop-shadow-xs">
                  {isDoorOpen ? "Cerrar" : "Tocar para abrir"}
                </span>
              </div>

              {/* Borde metálico de cierre hermético */}
              <div className="absolute inset-2 rounded-t-[145px] border border-white/35 pointer-events-none" />
            </motion.div>

            {/* Hint flotante cuando está de frente y cerrada */}
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
                            <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A8150] block font-bold">
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
