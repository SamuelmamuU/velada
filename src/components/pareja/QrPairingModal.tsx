"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  QrCode,
  Camera,
  Copy,
  Check,
  Heart,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrPairingModal({ isOpen, onClose }: QrPairingModalProps) {
  const { user, pareja, refreshPareja, vincularPareja, desvincularPareja } = useAuth();

  const [activeTab, setActiveTab] = useState<"mi_qr" | "escanear" | "estado">("mi_qr");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [codigoPropio, setCodigoPropio] = useState<string>("");
  const [loadingQr, setLoadingQr] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Estados de escaneo y entrada manual
  const [codigoManual, setCodigoManual] = useState<string>("");
  const [vincularLoading, setVincularLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorVinculacion, setErrorVinculacion] = useState<string | null>(null);

  // Cámara
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  // Cargar QR propio al abrir
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadQr = async () => {
      try {
        setLoadingQr(true);
        const savedToken = localStorage.getItem("velada_token");
        const res = await fetch("/api/pareja/codigo", {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setQrDataUrl(json.data.qrDataUrl);
            setCodigoPropio(json.data.codigo);
          }
        }
      } catch (err) {
        console.error("Error al cargar QR:", err);
      } finally {
        if (isMounted) setLoadingQr(false);
      }
    };

    loadQr();
    refreshPareja();

    return () => {
      isMounted = false;
    };
  }, [isOpen, refreshPareja]);

  // Manejador para iniciar la cámara
  const startScanner = async () => {
    setCameraError(null);
    try {
      if (qrScannerRef.current) {
        try {
          await qrScannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Detectar código escaneado
          try {
            await html5QrCode.stop();
          } catch {
            // ignore
          }
          setCameraActive(false);

          // Extraer código si viene como URL (ej: /vincular?codigo=...) o código directo
          let codeToUse = decodedText.trim().toUpperCase();
          if (codeToUse.includes("codigo=")) {
            const match = codeToUse.match(/codigo=([^&]+)/);
            if (match) codeToUse = match[1].toUpperCase();
          }

          setCodigoManual(codeToUse);
          await ejecutarVinculacion(codeToUse);
        },
        () => {
          // Frame callback de búsqueda continua, silencioso
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn("No se pudo iniciar la cámara:", err);
      setCameraError(
        "No se pudo acceder a la cámara. Puedes escribir el código de tu pareja manualmente abajo."
      );
      setCameraActive(false);
    }
  };

  const stopScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        if (cameraActive) {
          await qrScannerRef.current.stop();
        }
        qrScannerRef.current.clear();
      } catch {
        // ignore
      }
      qrScannerRef.current = null;
    }
    setCameraActive(false);
  }, [cameraActive]);

  // Detener cámara si se cambia de pestaña o se cierra el modal
  useEffect(() => {
    if (activeTab !== "escanear" || !isOpen) {
      stopScanner();
    }
  }, [activeTab, isOpen, stopScanner]);

  // Limpieza al desmontar componente
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);


  const handleCopyCode = () => {
    if (!codigoPropio) return;
    navigator.clipboard.writeText(codigoPropio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const ejecutarVinculacion = async (codigo: string) => {
    const cleanCode = codigo.trim().toUpperCase();
    if (!cleanCode) {
      setErrorVinculacion("Por favor escribe un código válido.");
      return;
    }

    setVincularLoading(true);
    setErrorVinculacion(null);
    setMensajeExito(null);

    const res = await vincularPareja(cleanCode);
    if (!res.success) {
      setErrorVinculacion(res.error || "No se pudo vincular la cuenta.");
      setVincularLoading(false);
    } else {
      setMensajeExito(res.message || "¡Conexión establecida con éxito!");
      setVincularLoading(false);
      setCodigoManual("");
      setTimeout(() => {
        setActiveTab("estado");
      }, 1200);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await ejecutarVinculacion(codigoManual);
  };

  const handleDesvincular = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas desvincular tu cuenta de pareja? Podrás volver a vincularte cuando quieras con un nuevo código."
      )
    ) {
      return;
    }

    setVincularLoading(true);
    const res = await desvincularPareja();
    setVincularLoading(false);
    if (res.success) {
      setActiveTab("mi_qr");
    } else {
      setErrorVinculacion(res.error || "Error al desvincular cuenta.");
    }
  };

  if (!isOpen) return null;

  const estaConectado = pareja?.estado === "conectados" || user?.estadoPareja === "conectados";
  const nombreParejaDisplay = pareja?.parejaNombre || user?.nombrePareja || "Tu Pareja";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-letter border border-sky-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Cabecera del modal estilo tarjeta postal */}
          <div className="relative px-6 pt-6 pb-4 border-b border-sky-100/80 bg-gradient-to-r from-sky-50/70 via-cream-50/50 to-blush-50/40">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-ink-soft hover:text-ink hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-sky-800 font-mono text-[11px] uppercase tracking-wider mb-1">
              <Sparkles size={14} className="text-sky-600" />
              <span>Sincronización de Buzón</span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-ink">
              Vincular Pareja por QR
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Conecta ambas cuentas para compartir cartas, citas y recuerdos en su diario común.
            </p>

            {/* Pestañas de navegación */}
            <div className="flex gap-2 mt-4 pt-2 border-t border-sky-200/50">
              <button
                onClick={() => setActiveTab("mi_qr")}
                className={`flex-1 py-2 px-2.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "mi_qr"
                    ? "bg-white text-sky-900 shadow-xs border border-sky-200"
                    : "text-ink-soft hover:text-ink hover:bg-white/50"
                }`}
              >
                <QrCode size={14} className="text-sky-600" />
                <span>Mi Código QR</span>
              </button>

              <button
                onClick={() => setActiveTab("escanear")}
                className={`flex-1 py-2 px-2.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "escanear"
                    ? "bg-white text-sky-900 shadow-xs border border-sky-200"
                    : "text-ink-soft hover:text-ink hover:bg-white/50"
                }`}
              >
                <Camera size={14} className="text-sky-600" />
                <span>Escanear o Ingresar</span>
              </button>

              <button
                onClick={() => setActiveTab("estado")}
                className={`flex-1 py-2 px-2.5 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "estado"
                    ? "bg-white text-sky-900 shadow-xs border border-sky-200"
                    : "text-ink-soft hover:text-ink hover:bg-white/50"
                }`}
              >
                <Heart
                  size={14}
                  className={estaConectado ? "text-blush-500 fill-blush-400" : "text-ink-soft"}
                />
                <span>Estado</span>
              </button>
            </div>
          </div>

          {/* Contenido según pestaña activa */}
          <div className="p-6 overflow-y-auto space-y-4">
            {/* ========================================================================= */}
            {/* PESTAÑA 1: MI CÓDIGO QR */}
            {/* ========================================================================= */}
            {activeTab === "mi_qr" && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative p-4 bg-white rounded-2xl border border-sky-200 shadow-sm flex items-center justify-center">
                  {loadingQr ? (
                    <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-sky-800">
                      <Loader2 size={28} className="animate-spin text-sky-600" />
                      <span className="text-xs">Generando código postal...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrDataUrl}
                        alt="Código QR de vinculación"
                        className="w-56 h-56 rounded-xl object-contain"
                      />
                      <div className="absolute inset-0 border-2 border-dashed border-sky-300/40 rounded-xl pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-xs text-ink-soft">
                      No se pudo cargar el código QR
                    </div>
                  )}
                </div>

                {/* Código alfanumérico destacado */}
                <div className="w-full max-w-xs bg-sky-50/80 border border-sky-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-sky-800/80">
                      Código de Invitación
                    </span>
                    <span className="font-mono text-base font-bold text-sky-950 tracking-wider">
                      {codigoPropio || "AVENTURA-LOVE"}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-white border border-sky-200 hover:bg-sky-100 text-sky-800 transition-all cursor-pointer shadow-2xs"
                    title="Copiar código al portapapeles"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>

                <p className="text-xs text-ink-soft max-w-sm leading-relaxed">
                  Pídele a tu pareja que abra la sección <strong>Escanear</strong> en su teléfono
                  o ingrese este código para sincronizar automáticamente sus buzones de cartas y citas.
                </p>

                {estaConectado && (
                  <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>Ya estás conectado con <strong>{nombreParejaDisplay}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 2: ESCANEAR O INGRESAR CÓDIGO */}
            {/* ========================================================================= */}
            {activeTab === "escanear" && (
              <div className="space-y-5">
                {/* Lector de cámara QR */}
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[280px] h-[280px] bg-slate-900 rounded-2xl overflow-hidden relative border-2 border-sky-300 shadow-md flex items-center justify-center">
                    <div id={scannerContainerId} className="w-full h-full" />

                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3 z-10">
                        <Camera size={36} className="text-sky-300 stroke-[1.5]" />
                        <p className="text-xs text-slate-300">
                          Usa la cámara de tu dispositivo para leer el código QR de tu pareja al instante.
                        </p>
                        <button
                          onClick={startScanner}
                          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <Camera size={14} />
                          <span>Activar Cámara</span>
                        </button>
                      </div>
                    )}

                    {cameraActive && (
                      <button
                        onClick={stopScanner}
                        className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] hover:bg-black/80 transition-colors"
                      >
                        Detener cámara
                      </button>
                    )}
                  </div>

                  {cameraError && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                      {cameraError}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-sky-200" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-ink-soft">
                    O escribe el código
                  </span>
                  <div className="flex-1 h-px bg-sky-200" />
                </div>

                {/* Formulario alternativo de entrada manual */}
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  {errorVinculacion && (
                    <div className="p-3 rounded-xl bg-blush-50 border border-blush-200 text-ink text-xs flex items-start gap-2">
                      <AlertCircle size={16} className="text-blush-500 flex-shrink-0 mt-0.5" />
                      <span>{errorVinculacion}</span>
                    </div>
                  )}

                  {mensajeExito && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                      <span>{mensajeExito}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
                      Código de vinculación de tu pareja
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={codigoManual}
                        onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
                        placeholder="ej. AVENTURA-7K3P"
                        className="w-full py-3 px-3.5 pl-10 border border-sky-200 rounded-xl font-mono uppercase text-sm bg-sky-50/40 text-ink tracking-wider focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition-all"
                      />
                      <KeyRound
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600 opacity-70"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={vincularLoading || !codigoManual.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-sans text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {vincularLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Sincronizando buzones...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Unir Nuestras Cuentas</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 3: ESTADO DE CONEXIÓN */}
            {/* ========================================================================= */}
            {activeTab === "estado" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                      Estado de Sincronización
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        estaConectado
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          estaConectado ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                      />
                      {estaConectado ? "Conectados" : "Esperando Pareja"}
                    </span>
                  </div>

                  {estaConectado ? (
                    <div className="space-y-3 pt-2 border-t border-sky-200/60">
                      <div>
                        <span className="text-[11px] text-ink-soft block">Pareja Vinculada</span>
                        <span className="font-serif text-lg font-bold text-ink">
                          {nombreParejaDisplay}
                        </span>
                        {pareja?.parejaEmail && (
                          <span className="block text-xs text-sky-800 font-mono">
                            {pareja.parejaEmail}
                          </span>
                        )}
                      </div>

                      {pareja?.fechaVinculacion && (
                        <div>
                          <span className="text-[11px] text-ink-soft block">Fecha de Unión</span>
                          <span className="text-xs text-ink font-medium">
                            {new Date(pareja.fechaVinculacion).toLocaleDateString("es-MX", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}

                      <div className="pt-2">
                        <p className="text-xs text-ink-soft leading-relaxed">
                          Ambos tienen acceso sincronizado al mismo buzón. Las citas que cree el novio
                          llegarán de inmediato como cartas al buzón de la novia, y los recuerdos
                          fotográficos se guardarán para ambos.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-sky-200/60 space-y-2">
                      <p className="text-xs text-ink-soft leading-relaxed">
                        Aún no has conectado tu cuenta con la de tu pareja. Comparte tu código QR o
                        escanea el de tu pareja para comenzar su historia compartida.
                      </p>
                    </div>
                  )}
                </div>

                {estaConectado && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleDesvincular}
                      disabled={vincularLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Unlink size={14} />
                      <span>Desvincular Pareja</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pie de modal */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-sky-100 flex items-center justify-between text-[11px] text-ink-soft font-mono">
            <span>Nuestras Aventuras</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white border border-line hover:bg-sky-50 text-ink font-sans text-xs font-medium cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
