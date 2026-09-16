"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ICitaResponse, IRecuerdoIndependiente } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getTheme } from "@/lib/theme";
import { sendImmediateNotification } from "@/lib/mobileNative";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { NovioForm } from "@/components/novio/NovioForm";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { CoupleAvatarHeader } from "@/components/dashboard/CoupleAvatarHeader";
import { AdventureCalendar } from "@/components/dashboard/AdventureCalendar";
import { PolaroidMemoriesGallery } from "@/components/citas/PolaroidMemoriesGallery";
import { QrPairingModal } from "@/components/pareja/QrPairingModal";
import {
  Plus,
  Sparkles,
  Loader2,
  CalendarHeart,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Edit2,
  Mail,
  QrCode,
  Calendar,
  Camera,
} from "lucide-react";

interface NovioDashboardProps {
  onViewDetail?: (cita: ICitaResponse) => void;
}

export function NovioDashboard({ onViewDetail }: NovioDashboardProps) {
  const { token, user, pareja } = useAuth();
  const theme = getTheme(pareja?.colorDashboardNovio, "azul");
  const partnerName =
    user?.nombrePareja || pareja?.parejaNombre || "tu novia";

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [recuerdos, setRecuerdos] = useState<IRecuerdoIndependiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    "list" | "create" | "edit" | "detail"
  >("list");
  const [activeTab, setActiveTab] = useState<"calendario" | "cartas" | "polaroids">("calendario");
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);
  const [detailInitialSide, setDetailInitialSide] = useState<
    "letter" | "map" | "memory"
  >("letter");
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Estados de modal de eliminación y notificaciones
  const [citaToDelete, setCitaToDelete] = useState<ICitaResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevCitasStatusMapRef = useRef<Map<string, string>>(new Map());
  const isFirstFetchNovioRef = useRef(true);

  // Inicializar estado previo de citas desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("velada_novio_citas_status");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === "object") {
            prevCitasStatusMapRef.current = new Map(Object.entries(parsed));
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchCitas = useCallback(
    async (isPolling = false) => {
      if (!token) return;
      try {
        if (!isPolling) setLoading(true);
        const res = await fetch("/api/citas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.citas)) {
          let localRecuerdos: Record<string, any> = {};
          try {
            localRecuerdos = JSON.parse(
              localStorage.getItem("velada_recuerdos") || "{}"
            );
          } catch {}

          const fetchedCitas: ICitaResponse[] = data.citas.map(
            (c: ICitaResponse) => {
              if (!c.recuerdo && localRecuerdos[c.id]) {
                return { ...c, recuerdo: localRecuerdos[c.id] };
              }
              if (c.recuerdo) {
                localRecuerdos[c.id] = c.recuerdo;
              }
              return c;
            }
          );

          try {
            localStorage.setItem(
              "velada_recuerdos",
              JSON.stringify(localRecuerdos)
            );
          } catch {}

          setCitas(fetchedCitas);

          if (isFirstFetchNovioRef.current) {
            isFirstFetchNovioRef.current = false;
            if (prevCitasStatusMapRef.current.size === 0) {
              fetchedCitas.forEach((c) => {
                prevCitasStatusMapRef.current.set(c.id, c.estado);
              });
              try {
                const obj = Object.fromEntries(prevCitasStatusMapRef.current);
                localStorage.setItem("velada_novio_citas_status", JSON.stringify(obj));
              } catch {}
            }
          }

          // Detectar si la novia ha respondido aceptando o rechazando alguna cita
          for (const cita of fetchedCitas) {
            const prevStatus = prevCitasStatusMapRef.current.get(cita.id);
            if (prevStatus && prevStatus !== cita.estado) {
              const partner = partnerName || "Tu novia";

              if (cita.estado === "aceptada" || cita.estado === "confirmada") {
                sendImmediateNotification({
                  title: "💖 ¡Tu cita fue aceptada!",
                  body: `¡${partner} ha aceptado tu invitación: "${cita.nombre}"! Todo listo para su velada.`,
                  extra: { citaId: cita.id, type: "cita_aceptada" },
                });
              } else if (cita.estado === "rechazada") {
                sendImmediateNotification({
                  title: "💌 Respuesta a tu invitación",
                  body: `${partner} ha declinado la cita: "${cita.nombre}". Puedes proponerle otra fecha con cariño.`,
                  extra: { citaId: cita.id, type: "cita_rechazada" },
                });
              }
            }

            // Detectar propuesta de cambio de horario
            const hadPendingProposal =
              prevCitasStatusMapRef.current.get(`${cita.id}_propuesta`) === "pendiente";
            const nowHasPendingProposal =
              cita.propuestaCambio?.estado === "pendiente";
            if (!hadPendingProposal && nowHasPendingProposal) {
              sendImmediateNotification({
                title: "📅 ¡Nueva propuesta de horario!",
                body: `${partnerName} ha sugerido un nuevo horario para la cita: "${cita.nombre}".`,
                extra: { citaId: cita.id, type: "nueva_propuesta" },
              });
            }
            if (nowHasPendingProposal) {
              prevCitasStatusMapRef.current.set(`${cita.id}_propuesta`, "pendiente");
            } else {
              prevCitasStatusMapRef.current.delete(`${cita.id}_propuesta`);
            }

            prevCitasStatusMapRef.current.set(cita.id, cita.estado);
          }

          try {
            const obj = Object.fromEntries(prevCitasStatusMapRef.current);
            localStorage.setItem("velada_novio_citas_status", JSON.stringify(obj));
          } catch {}
        }
      } catch (err) {
        console.error("Error al cargar citas del novio:", err);
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [token, partnerName]
  );

  // Cargar recuerdos independientes
  const fetchRecuerdos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/recuerdos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      let local: IRecuerdoIndependiente[] = [];
      try {
        local = JSON.parse(
          localStorage.getItem("velada_polaroids_libres") || "[]"
        );
      } catch {}

      if (data.success && Array.isArray(data.recuerdos)) {
        const map = new Map<string, IRecuerdoIndependiente>();
        data.recuerdos.forEach((r: IRecuerdoIndependiente) => map.set(r.id, r));
        local.forEach((r: IRecuerdoIndependiente) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
        setRecuerdos(merged);
      } else if (local.length > 0) {
        setRecuerdos(local);
      }
    } catch (e) {
      console.debug("Error cargando recuerdos:", e);
    }
  }, [token]);

  useEffect(() => {
    fetchCitas();
    fetchRecuerdos();
    const interval = setInterval(() => {
      fetchCitas(true);
      fetchRecuerdos();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCitas, fetchRecuerdos]);

  const handleCreateSuccess = (nuevaCita: ICitaResponse) => {
    setCitas((prev) => [nuevaCita, ...prev]);
    setCurrentView("list");
    setToastMessage("¡Carta de amor creada con éxito!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleEditSuccess = (citaActualizada: ICitaResponse) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === citaActualizada.id ? citaActualizada : c))
    );
    setCurrentView("list");
    setSelectedCita(null);
    setToastMessage("Cita actualizada correctamente");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteConfirm = async () => {
    if (!citaToDelete || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/citas/${citaToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCitas((prev) => prev.filter((c) => c.id !== citaToDelete.id));
        setCitaToDelete(null);
        setToastMessage("Cita eliminada correctamente");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Citas con propuesta de cambio pendiente de la novia
  const citasConPropuesta = citas.filter(
    (c) => c.propuestaCambio?.estado === "pendiente"
  );

  return (
    <div className={`min-h-screen text-ink pb-20 bg-gradient-to-b ${theme.bgGradient}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-ink text-white py-3 px-5 rounded-2xl shadow-2xl border border-sky-200/30 flex items-center gap-3 animate-fade-up">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1040px] mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Cabecera superior con marca y usuario */}
        <AppHeader
          tag={
            currentView === "create"
              ? "NUEVA CITA"
              : currentView === "edit"
              ? "EDITAR CITA"
              : currentView === "detail"
              ? "DETALLE DE LA CITA"
              : "PANEL DEL NOVIO"
          }
          onBack={
            currentView !== "list"
              ? () => {
                  setCurrentView("list");
                  setSelectedCita(null);
                }
              : undefined
          }
          backLabel="Volver a la lista"
        />

        {/* Vista de Detalle Individual (Carta de amor interactiva con respuestas) */}
        {currentView === "detail" && selectedCita && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between gap-3 bg-white/80 backdrop-blur border border-sky-200/70 p-3 rounded-2xl shadow-xs max-w-[760px] mx-auto">
              <span className="text-xs font-medium text-sky-800 flex items-center gap-1.5 pl-2">
                <Mail size={14} className="text-sky-600" />
                <span>Vista de la carta de amor</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView("edit")}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Editar cita</span>
                </button>
                <button
                  onClick={() => setCitaToDelete(selectedCita)}
                  className="px-3 py-1.5 rounded-xl border border-blush-200 text-blush-500 hover:bg-blush-50 font-medium text-xs transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <LoveLetterView
              cita={selectedCita}
              initialSide={detailInitialSide}
              onClose={() => {
                setCurrentView("list");
                setSelectedCita(null);
              }}
              onCitaUpdated={(updated) => {
                setCitas((prev) =>
                  prev.map((c) => (c.id === updated.id ? updated : c))
                );
                setSelectedCita(updated);
              }}
            />
          </div>
        )}

        {/* Vista de Creación o Edición */}
        {currentView === "create" && (
          <NovioForm
            token={token!}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCurrentView("list")}
          />
        )}

        {currentView === "edit" && (
          <NovioForm
            initialCita={selectedCita}
            token={token!}
            onSuccess={handleEditSuccess}
            onCancel={() => {
              setCurrentView("list");
              setSelectedCita(null);
            }}
          />
        )}

        {/* Vista Principal: Lista, Calendario y Recuerdos */}
        {currentView === "list" && (
          <div className="space-y-6">
            {/* Visual de Perfil Entrelazado de Ambos con Corazón Superior */}
            <CoupleAvatarHeader theme={theme} />

            {/* Pestañas de Navegación Principal */}
            <div className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl max-w-fit mx-auto sm:mx-0 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("calendario")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "calendario"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Calendar size={15} />
                <span>Calendario de Aventuras</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("cartas")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "cartas"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Mail size={15} />
                <span>Mis Cartas</span>
                {citasConPropuesta.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                    {citasConPropuesta.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("polaroids")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "polaroids"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-ink-soft hover:text-ink hover:bg-slate-50"
                }`}
              >
                <Camera size={15} />
                <span>Álbum Polaroid</span>
                {recuerdos.length > 0 && (
                  <span className="text-[10px] opacity-75 font-mono">
                    ({recuerdos.length})
                  </span>
                )}
              </button>
            </div>

            {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}
            {activeTab === "calendario" && (
              <div className="space-y-6 animate-fade-up">
                {/* Calendario interactivo con citas (carta con corazón / polaroid) */}
                <AdventureCalendar
                  citas={citas}
                  recuerdos={recuerdos}
                  theme={theme}
                  onSelectCita={(c) => {
                    setSelectedCita(c);
                    setDetailInitialSide("letter");
                    setCurrentView("detail");
                    onViewDetail?.(c);
                  }}
                  onNewCita={() => setCurrentView("create")}
                  onRecuerdoAdded={(nuevo) => {
                    setRecuerdos((prev) => [nuevo, ...prev]);
                  }}
                />
              </div>
            )}

            {activeTab === "cartas" && (
              <div className="space-y-6 animate-fade-up">
                {/* Banner de propuestas de cambio pendientes enviadas por la novia */}
                {!loading && citasConPropuesta.length > 0 && (
                  <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-200/80 rounded-2xl p-5 shadow-sm animate-fade-up">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white">
                          <CalendarClock size={20} />
                        </div>
                        <div>
                          <h4 className="font-serif font-semibold text-base text-ink">
                            {partnerName} ha propuesto un cambio de horario en {citasConPropuesta.length}{" "}
                            {citasConPropuesta.length === 1 ? "cita" : "citas"}
                          </h4>
                          <p className="text-xs text-ink-soft">
                            Revisa la sugerencia para aceptar o conservar la fecha original.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCita(citasConPropuesta[0]);
                          setCurrentView("detail");
                        }}
                        className="bg-ink hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Revisar propuesta
                      </button>
                    </div>
                  </div>
                )}

                {/* Banner de Invitación QR si no está conectado aún */}
                {!loading && pareja?.estado !== "conectados" && user?.estadoPareja !== "conectados" && (
                  <div className="bg-sky-50/90 border border-sky-200 rounded-2xl p-5 shadow-xs animate-fade-up">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                          <QrCode size={20} />
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-sky-950">
                            Conecta con {partnerName} para enviarle cartas
                          </h4>
                          <p className="text-xs text-ink-soft">
                            Muestra tu código QR o compártele tu código de invitación para que tus cartas lleguen directamente a su buzón.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setQrModalOpen(true)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode size={14} />
                        <span>Ver mi Código QR</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Encabezado de la Sección */}
                <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
                  <div>
                    <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-sky-700 font-bold mb-1">
                      Tus cartas e invitaciones
                    </p>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                      Nuestras Aventuras
                    </h1>
                    <p className="text-ink-soft text-sm mt-1 font-normal">
                      {citas.length}{" "}
                      {citas.length === 1 ? "carta registrada" : "cartas registradas"} · {partnerName}
                      {" "}las recibirá en formato de carta interactiva en su buzón.
                    </p>
                  </div>

                  <button
                    onClick={() => setCurrentView("create")}
                    className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 px-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:translate-y-0 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Escribir nueva carta</span>
                  </button>
                </div>

                {/* Estado de Carga */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                    <Loader2 size={32} className="animate-spin text-sky-600 mb-3" />
                    <p className="font-serif text-ink-soft text-sm">
                      Cargando tus cartas agendadas...
                    </p>
                  </div>
                )}

                {/* Estado Vacío */}
                {!loading && citas.length === 0 && (
                  <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-4">
                      <CalendarHeart size={28} />
                    </div>
                    <h3 className="font-serif text-xl font-bold mb-2 text-ink">
                      Aún no has escrito ninguna carta
                    </h3>
                    <p className="text-ink-soft text-sm leading-relaxed mb-6">
                      Sorprende a {partnerName} diseñando la primera invitación romántica, con
                      dedicatoria, fecha, lugar y mapa en su segunda hoja.
                    </p>
                    <button
                      onClick={() => setCurrentView("create")}
                      className="bg-sky-600 text-white font-bold text-sm py-3 px-5 rounded-xl hover:bg-sky-700 hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} className="text-sky-200" />
                      <span>Escribir la primera carta</span>
                    </button>
                  </div>
                )}

                {/* Cuadrícula de Tarjetas Tipo Invitación */}
                {!loading && citas.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {citas.map((cita, idx) => (
                      <InviteCard
                        key={cita.id}
                        cita={cita}
                        index={idx}
                        isNovio={true}
                        onSelect={(c) => {
                          setSelectedCita(c);
                          setDetailInitialSide("letter");
                          setCurrentView("detail");
                          onViewDetail?.(c);
                        }}
                        onEdit={(c) => {
                          setSelectedCita(c);
                          setCurrentView("edit");
                        }}
                        onDelete={(c) => setCitaToDelete(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "polaroids" && (
              <div className="animate-fade-up">
                <PolaroidMemoriesGallery
                  citas={citas}
                  recuerdos={recuerdos}
                  theme={theme}
                  onSelectMemory={(c) => {
                    setSelectedCita(c);
                    setDetailInitialSide("memory");
                    setCurrentView("detail");
                    onViewDetail?.(c);
                  }}
                  onRecuerdoAdded={(nuevo) => {
                    setRecuerdos((prev) => [nuevo, ...prev]);
                  }}
                  onRecuerdoDeleted={(id) => {
                    setRecuerdos((prev) => prev.filter((r) => r.id !== id));
                  }}
                  partnerName={partnerName}
                />
              </div>
            )}

            {/* Botón Flotante FAB */}
            <button
              onClick={() => setCurrentView("create")}
              title="Crear nueva cita"
              className="fixed right-6 bottom-6 z-40 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs sm:text-sm py-3.5 px-5 rounded-full shadow-2xl hover:shadow-[0_16px_30px_-12px_rgba(2,132,199,0.5)] transition-all flex items-center gap-2 cursor-pointer border border-sky-400/40"
            >
              <Plus size={18} />
              <span className="font-sans font-bold">Nueva carta</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Eliminar Cita */}
      {citaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-up">
          <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-serif text-xl font-semibold mb-2 text-ink">
              ¿Eliminar esta cita?
            </h3>
            <p className="text-ink-soft text-sm leading-relaxed mb-6">
              ¿Estás seguro de que deseas eliminar <strong>&ldquo;{citaToDelete.nombre}&rdquo;</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : "Eliminar"}
              </button>
              <button
                onClick={() => setCitaToDelete(null)}
                disabled={deleting}
                className="px-4 py-3 rounded-xl border border-slate-200 text-ink-soft hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <QrPairingModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
}
