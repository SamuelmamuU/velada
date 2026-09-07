"use client";

import React, { useState, useEffect } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { NovioForm } from "@/components/novio/NovioForm";
import { CitaDetailView } from "@/components/citas/CitaDetailView";
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
} from "lucide-react";

interface NovioDashboardProps {
  onViewDetail?: (cita: ICitaResponse) => void;
}

export function NovioDashboard({ onViewDetail }: NovioDashboardProps) {
  const { token } = useAuth();

  const [citas, setCitas] = useState<ICitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<
    "list" | "create" | "edit" | "detail"
  >("list");
  const [selectedCita, setSelectedCita] = useState<ICitaResponse | null>(null);

  // Estados de modal de eliminación y notificaciones
  const [citaToDelete, setCitaToDelete] = useState<ICitaResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCitas = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("/api/citas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.citas)) {
        setCitas(data.citas);
      }
    } catch (err) {
      console.error("Error al cargar citas:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateSuccess = (nuevaCita: ICitaResponse) => {
    setCitas((prev) =>
      [...prev, nuevaCita].sort(
        (a, b) =>
          new Date(a.horario).getTime() - new Date(b.horario).getTime()
      )
    );
    setCurrentView("list");
    showToast("Carta de invitación enviada exitosamente. Diana ya puede verla en su buzón.");
  };

  const handleEditSuccess = (citaActualizada: ICitaResponse) => {
    setCitas((prev) =>
      prev
        .map((c) => (c.id === citaActualizada.id ? citaActualizada : c))
        .sort(
          (a, b) =>
            new Date(a.horario).getTime() - new Date(b.horario).getTime()
        )
    );
    setCurrentView("list");
    setSelectedCita(null);
    showToast("Cita actualizada correctamente.");
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
        showToast("La cita ha sido eliminada.");
        setCitaToDelete(null);
      } else {
        alert(data.error || "No se pudo eliminar la cita");
      }
    } catch {
      alert("Error al conectar con el servidor.");
    } finally {
      setDeleting(false);
    }
  };

  // Citas con propuesta de cambio pendiente de la novia
  const citasConPropuesta = citas.filter(
    (c) => c.propuestaCambio?.estado === "pendiente"
  );

  return (
    <div className="min-h-screen bg-ivory text-ink">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-ink text-white py-3 px-5 rounded-2xl shadow-2xl border border-gold/30 flex items-center gap-3 animate-fade-up">
          <CheckCircle2 size={18} className="text-gold" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="max-w-[1040px] mx-auto px-6 py-8 sm:py-12">
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

        {/* Vista de Detalle Individual (Carta romántica con dog-ear) */}
        {currentView === "detail" && selectedCita && (
          <div className="space-y-4">
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

            <CitaDetailView
              cita={selectedCita}
              onBack={() => {
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

        {/* Vista Principal: Lista de Citas */}
        {currentView === "list" && (
          <div className="space-y-6">
            {/* Banner de propuestas de cambio pendientes enviadas por la novia */}
            {!loading && citasConPropuesta.length > 0 && (
              <div className="bg-gradient-to-r from-rose-soft/80 to-paper border border-rose/40 rounded-2xl p-5 shadow-sm animate-fade-up">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose flex items-center justify-center text-white">
                      <CalendarClock size={20} />
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-base text-ink">
                        Diana ha propuesto un cambio de horario en {citasConPropuesta.length}{" "}
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
                    className="bg-ink hover:bg-gold-deep text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Revisar propuesta
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
                  {citas.length === 1 ? "carta creada" : "cartas creadas"} · Diana
                  las recibirá en formato de carta interactiva con mapa en su buzón.
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
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-line">
                <Loader2 size={32} className="animate-spin text-sky-600 mb-3" />
                <p className="font-serif text-ink-soft text-sm">
                  Cargando tus cartas agendadas...
                </p>
              </div>
            )}

            {/* Estado Vacío */}
            {!loading && citas.length === 0 && (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border border-line shadow-card max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-4">
                  <CalendarHeart size={28} />
                </div>
                <h3 className="font-serif text-xl font-bold mb-2 text-ink">
                  Aún no has escrito ninguna carta
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed mb-6">
                  Sorprende a tu novia diseñando la primera invitación romántica, con
                  dedicatoria, fecha, lugar y mapa en su segunda hoja.
                </p>
                <button
                  onClick={() => setCurrentView("create")}
                  className="bg-sky-600 text-white font-bold text-sm py-3 px-5 rounded-xl hover:bg-sky-700 hover:shadow-md transition-all inline-flex items-center gap-2"
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

            {/* Botón Flotante FAB */}
            <button
              onClick={() => setCurrentView("create")}
              title="Crear nueva cita"
              className="fixed right-7 bottom-7 z-40 bg-gold hover:bg-gold-deep text-ink hover:text-white font-semibold text-sm py-3.5 px-5 rounded-full shadow-2xl hover:shadow-[0_16px_30px_-12px_rgba(43,36,56,0.5)] transition-all flex items-center gap-2 cursor-pointer border border-gold-deep/20"
            >
              <Plus size={18} />
              <span className="font-sans font-semibold">Nueva carta</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Eliminar Cita */}
      {citaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-up">
          <div className="bg-card rounded-2xl p-6 sm:p-7 max-w-sm w-full border border-line shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-soft flex items-center justify-center text-rose mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-serif text-xl font-semibold mb-2">
              ¿Eliminar esta cita?
            </h3>
            <p className="text-ink-soft text-sm leading-relaxed mb-6">
              ¿Estás seguro de que deseas eliminar <strong>&ldquo;{citaToDelete.nombre}&rdquo;</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-rose hover:bg-rose/90 text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : "Eliminar"}
              </button>
              <button
                onClick={() => setCitaToDelete(null)}
                disabled={deleting}
                className="px-4 py-3 rounded-xl border border-line text-ink-soft hover:bg-paper text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
