"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICitaResponse, RolUsuario, ModeloBuzon } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
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
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { MailboxStage } from "./three/types";
import { MailboxScene } from "./three/MailboxScene";

export type { MailboxStage };

interface Mailbox3DExperienceProps {
  initialStage?: MailboxStage;
  openTrigger?: number;
  pendingCitas?: ICitaResponse[];
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  onCloseToDashboard?: () => void;
  isLoginScreen?: boolean;
}

export function Mailbox3DExperience({
  initialStage = "lateral_login",
  openTrigger = 0,
  pendingCitas = [],
  onCitaUpdated,
  onCloseToDashboard,
  isLoginScreen = false,
}: Mailbox3DExperienceProps) {
  const { user, pareja, login, register } = useAuth();

  const novioName =
    user?.rol === "novio"
      ? user?.nombre
      : user?.nombrePareja || pareja?.parejaNombre || "Novio";
  const noviaName =
    user?.rol === "novia"
      ? user?.nombre
      : user?.nombrePareja || pareja?.parejaNombre || "Novia";
  const coupleNames = `${novioName} & ${noviaName}`;

  const coupleNamesRef = useRef(coupleNames);
  useEffect(() => {
    coupleNamesRef.current = coupleNames;
    if (sceneRef.current) {
      sceneRef.current.updateCoupleNames(coupleNames);
    }
  }, [coupleNames]);

  // Estados del flujo del buzón
  const [stage, setStage] = useState<MailboxStage>(initialStage);
  const [selectedLetter, setSelectedLetter] = useState<ICitaResponse | null>(null);
  const [activeEnvelopeIndex, setActiveEnvelopeIndex] = useState(0);

  const [modeloBuzonState, setModeloBuzonState] = useState<ModeloBuzon>(
    (pareja?.modeloBuzon || "clasico") as ModeloBuzon
  );

  useEffect(() => {
    if (pareja?.modeloBuzon) {
      setModeloBuzonState(pareja.modeloBuzon as ModeloBuzon);
    } else {
      try {
        const stored = localStorage.getItem("velada_modelo_buzon");
        if (stored === "clasico" || stored === "vintage" || stored === "moderno") {
          setModeloBuzonState(stored as ModeloBuzon);
        }
      } catch {}
    }
  }, [pareja?.modeloBuzon]);

  useEffect(() => {
    const handleModeloChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setModeloBuzonState(customEvent.detail as ModeloBuzon);
      }
    };
    window.addEventListener("velada_modelo_buzon_changed", handleModeloChange);
    return () => {
      window.removeEventListener("velada_modelo_buzon_changed", handleModeloChange);
    };
  }, []);

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);

  useEffect(() => {
    if (openTrigger && openTrigger > 0) {
      setStage("front_closed");
      const openTimer = setTimeout(() => {
        setStage("door_opening");
      }, 300);
      return () => clearTimeout(openTimer);
    }
  }, [openTrigger]);

  useEffect(() => {
    if (stage === "door_opening") {
      const timer = setTimeout(() => {
        setStage("letters_floating");
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Formulario en la etiqueta adhesiva lateral
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<RolUsuario>("novia");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLabelDisappearing, setIsLabelDisappearing] = useState(false);

  // Referencias Three.js
  const mountRef = useRef<HTMLDivElement>(null);
  const labelDomRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MailboxScene | null>(null);

  // Interacción en la puerta
  const handleDoorClick = useCallback(() => {
    setStage((prev) => {
      if (prev === "front_closed") {
        setTimeout(() => setStage("letters_floating"), 850);
        return "door_opening";
      } else if (prev === "door_opening" || prev === "letters_floating") {
        return "front_closed";
      }
      return prev;
    });
  }, []);

  // Interacción en el sobre
  const handleEnvelopeClick = useCallback((cita: ICitaResponse) => {
    setSelectedLetter(cita);
    setStage("letter_expanded");
  }, []);

  // Inicialización de la escena Three.js (Una sola vez en el montaje)
  useEffect(() => {
    const container = mountRef.current;
    const labelDom = labelDomRef.current;
    if (!container) return;

    const scene = new MailboxScene({
      container,
      labelDomElement: labelDom,
      initialStage: stage,
      modelo: modeloBuzonState,
      coupleNames: coupleNamesRef.current,
      novioName,
      noviaName,
      pendingCitas,
      activeEnvelopeIndex,
      onDoorClick: handleDoorClick,
      onEnvelopeClick: handleEnvelopeClick,
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDoorClick, handleEnvelopeClick, novioName, noviaName]);

  // Sincronizar cambios de stage SIN recrear la escena WebGL
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setStage(stage);
    }
  }, [stage]);

  // Sincronizar cambio de modelo de buzón
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setModelo(modeloBuzonState);
    }
  }, [modeloBuzonState]);

  // Sincronizar cartas pendientes y carta activa
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateCitas(pendingCitas, activeEnvelopeIndex);
    }
  }, [pendingCitas, activeEnvelopeIndex]);

  // Navegación entre varias cartas
  const handlePrevLetter = () => {
    if (pendingCitas.length <= 1) return;
    setActiveEnvelopeIndex((prev) => (prev > 0 ? prev - 1 : pendingCitas.length - 1));
  };

  const handleNextLetter = () => {
    if (pendingCitas.length <= 1) return;
    setActiveEnvelopeIndex((prev) => (prev < pendingCitas.length - 1 ? prev + 1 : 0));
  };

  // Cerrar/responder carta y guardar en tablero
  const handleCloseExpandedLetter = () => {
    setSelectedLetter(null);
    setStage("docking");
    setTimeout(() => {
      setStage("minimized_widget");
      onCloseToDashboard?.();
    }, 600);
  };

  // Restaurar buzón al centro desde el widget miniatura
  const handleRestoreFromWidget = () => {
    setStage("front_closed");
    setTimeout(() => {
      setStage("door_opening");
    }, 300);
  };

  // Login en la etiqueta postal lateral
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Por favor completa tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setIsLabelDisappearing(true);

    try {
      const res = await login(email, password, {
        delayCommitMs: 1400,
        onPreCommit: () => {
          setStage("rotating_to_front");
          try {
            sessionStorage.setItem("mailbox_auto_open", "true");
            sessionStorage.setItem("mailbox_stage", "front_closed");
          } catch {}
        },
      });
      if (!res.success) {
        setIsLabelDisappearing(false);
        setAuthError(res.error || "No se pudo iniciar sesión. Revisa tus credenciales.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setIsLabelDisappearing(false);
      setAuthError("Error de comunicación con el servidor.");
      setAuthLoading(false);
    }
  };

  // Registro en la etiqueta postal lateral
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
    setIsLabelDisappearing(true);

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
        setIsLabelDisappearing(false);
        setAuthError(res.error || "No se pudo registrar la cuenta.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setIsLabelDisappearing(false);
      setAuthError("Error al registrar perfil.");
      setAuthLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante miniatura cuando está minimizado en el dashboard */}
      {!isLoginScreen && stage === "minimized_widget" && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-up select-none">
          <motion.button
            type="button"
            onClick={handleRestoreFromWidget}
            whileHover={{ scale: 1.08, rotate: -2 }}
            whileTap={{ scale: 0.94 }}
            className="group relative flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 pr-4 rounded-2xl shadow-letter border border-sky-200/90 text-left cursor-pointer transition-all hover:shadow-xl hover:border-sky-300"
            title="Abrir Buzón 3D de Nuestras Aventuras"
          >
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

              {pendingCitas.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-handwriting text-base font-bold text-sky-950 leading-tight">
                  {coupleNames}
                </span>
                {pendingCitas.length > 0 && (
                  <span className="bg-blush-100 text-blush-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-blush-200 font-mono">
                    {pendingCitas.length}
                  </span>
                )}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700/80">
                {pendingCitas.length > 0 ? "Cartas pendientes" : "Buzón al día"}
              </p>
            </div>

            <Maximize2
              size={14}
              className="text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
            />
          </motion.button>
        </div>
      )}

      {/* Contenedor del Buzón 3D (Lienzo en vivo montado persistentemente con arrastre orbital 360°) */}
      <div
        className={
          isLoginScreen
            ? "relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
            : `fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
                stage === "docking" || stage === "minimized_widget"
                  ? "bg-transparent backdrop-blur-none pointer-events-none opacity-0"
                  : "bg-[#101D2B]/80 backdrop-blur-md opacity-100 pointer-events-auto"
              }`
        }
      >
        {/* Botón superior de cerrar hacia el dashboard si no es login */}
        {!isLoginScreen &&
          stage !== "lateral_login" &&
          stage !== "minimized_widget" &&
          stage !== "docking" && (
            <button
              type="button"
              onClick={() => {
                setStage("docking");
                setTimeout(() => {
                  setStage("minimized_widget");
                  onCloseToDashboard?.();
                }, 600);
              }}
              className="fixed top-5 right-5 z-50 p-2.5 rounded-full bg-white/90 hover:bg-white text-ink-soft hover:text-ink shadow-md transition-transform hover:scale-105 cursor-pointer border border-sky-100"
              title="Minimizar buzón e ir al tablero"
            >
              <X size={18} />
            </button>
          )}

        {/* Botón de reseteo de cámara 3D si se rotó el buzón */}
        {stage !== "lateral_login" && stage !== "minimized_widget" && (
          <button
            type="button"
            onClick={() => {
              if (sceneRef.current) {
                sceneRef.current.resetOrbit();
              }
            }}
            className="fixed bottom-5 left-5 z-40 p-2 rounded-full bg-white/85 hover:bg-white text-sky-900 text-xs font-bold shadow-md border border-sky-100 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
            title="Restablecer vista frontal de cámara 3D"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Centrar Vista 3D</span>
          </button>
        )}

        {/* LIENZO 3D THREE.JS (Contenedor de WebGL y CSS3D) */}
        <div
          ref={mountRef}
          style={{ touchAction: "none" }}
          className={`relative w-full ${
            isLoginScreen ? "h-screen min-h-[620px]" : "h-full min-h-[500px]"
          } flex items-center justify-center select-none cursor-grab active:cursor-grabbing`}
        />

        {/* ========================================================================= */}
        {/* LA ETIQUETA ADHESIVA DE ACCESO (Inyectada al CSS3DRenderer en el Costado) */}
        {/* ========================================================================= */}
        <div style={{ display: "none" }}>
          <div
            ref={labelDomRef}
            style={{
              opacity: stage === "lateral_login" && !isLabelDisappearing ? 1 : 0,
              transform:
                stage === "lateral_login" && !isLabelDisappearing
                  ? "scale(1)"
                  : "scale(0.8)",
              transition:
                "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents:
                stage === "lateral_login" && !isLabelDisappearing ? "auto" : "none",
            }}
            className="w-[340px] max-w-[92vw] bg-gradient-to-b from-[#FAF8EE] to-[#F1E9D2] rounded-xl p-3.5 text-center border-2 border-dashed border-[#D2C5A7] shadow-[0_10px_25px_rgba(10,25,50,0.35)] select-text"
          >
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

            {/* Selector de modo Login / Registro */}
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
              <form onSubmit={handleLoginSubmit} className="space-y-2.5 text-left">
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
                      className="w-full py-2 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/95 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                    />
                    <Mail
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                    Contraseña Secreta
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-2 px-2.5 pl-8 pr-9 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/95 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                    />
                    <Lock
                      size={13}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-0.5 cursor-pointer"
                      title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

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
                  <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                    Tipo de perfil a crear
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole("novio")}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        regRole === "novio"
                          ? "border-sky-500 bg-sky-100 text-sky-950 shadow-xs ring-1 ring-sky-400 font-extrabold"
                          : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-sky-50/50"
                      }`}
                    >
                      <User size={12} className="text-sky-700" />
                      <span>Novio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole("novia")}
                      className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        regRole === "novia"
                          ? "border-blush-400 bg-blush-100 text-blush-950 shadow-xs ring-1 ring-blush-300 font-extrabold"
                          : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-blush-50/50"
                      }`}
                    >
                      <Heart size={12} className="text-blush-500 fill-blush-400" />
                      <span>Novia</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="ej. Jorge, Sofía..."
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
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full py-1.5 px-2.5 pr-9 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-0.5 cursor-pointer"
                      title={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
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

        {/* Indicador táctil para abrir la puerta cuando el buzón está de frente y cerrado */}
        {stage === "front_closed" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={handleDoorClick}
            className="absolute bottom-10 z-40 flex flex-col items-center cursor-pointer select-none"
          >
            <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2 hover:scale-105 transition-transform">
              <Heart size={15} className="fill-blush-400 text-blush-400 animate-ping" />
              <span>Toca el buzón 3D o la puerta para abrirlo</span>
            </div>
          </motion.div>
        )}

        {/* Controles y Navegación de cartas flotantes 3D */}
        {stage === "letters_floating" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-8 sm:bottom-10 z-40 flex flex-col items-center select-none"
          >
            {pendingCitas.length > 0 ? (
              <div className="flex flex-col items-center gap-3">
                {/* Paginador con flechas si hay más de 1 carta pendiente */}
                {pendingCitas.length > 1 && (
                  <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-sky-100 shadow-md">
                    <button
                      type="button"
                      onClick={handlePrevLetter}
                      className="p-1 text-sky-800 hover:text-sky-950 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
                      title="Carta anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-xs font-bold text-sky-900">
                      {activeEnvelopeIndex + 1} de {pendingCitas.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextLetter}
                      className="p-1 text-sky-800 hover:text-sky-950 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
                      title="Siguiente carta"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-500 animate-bounce" />
                  <span>Toca la carta 3D en el centro para desplegarla</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-sky-100 shadow-xl text-center max-w-sm pointer-events-auto">
                <Heart size={26} className="fill-sky-400 text-sky-500 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-base text-ink">Buzón al día</h3>
                <p className="text-xs text-ink-soft mt-1">
                  No tienes cartas pendientes por responder.
                </p>
                <button
                  type="button"
                  onClick={handleCloseExpandedLetter}
                  className="mt-3 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Ir al Tablero Principal
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VISTA DESPLEGADA DE LA CARTA (LoveLetterView) */}
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
    </>
  );
}
