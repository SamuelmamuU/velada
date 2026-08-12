"use client";

import React, { useState, useEffect } from "react";
import { ICitaResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { InviteCard } from "@/components/citas/InviteCard";
import { NovioForm } from "@/components/novio/NovioForm";
import {
  Plus,
  Sparkles,
  Loader2,
  CalendarHeart,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { CitaDetailView } from "@/components/citas/CitaDetailView";

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
    showToast("¡Velada agendada exitosamente! Tu novia ya puede verla 💛");
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
    showToast("Cita actualizada correctamente ✨");
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

        {/* Vista de Detalle Individual */}
        {currentView === "detail" && selectedCita && (
          <CitaDetailView
            cita={selectedCita}
            onBack={() => {
              setCurrentView("list");
              setSelectedCita(null);
            }}
          />
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
          <div>
            {/* Encabezado de la Sección */}
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <div>
                <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-gold-deep font-semibold mb-1">
                  Tus citas agendadas
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
                  Próximas veladas
                </h1>
                <p className="text-ink-soft text-sm mt-1 font-normal">
                  {citas.length}{" "}
                  {citas.length === 1 ? "cita creada" : "citas creadas"} · la novia
                  puede verlas en cuanto las agendes.
                </p>
              </div>

              <button
                onClick={() => setCurrentView("create")}
                className="inline-flex items-center gap-2 bg-gold hover:bg-gold-deep text-ink hover:text-white font-semibold text-sm py-3 px-5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-150 active:translate-y-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Nueva cita</span>
              </button>
            </div>

            {/* Estado de Carga */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-line">
                <Loader2 size={32} className="animate-spin text-gold-deep mb-3" />
                <p className="font-serif text-ink-soft text-sm">
                  Cargando tus veladas agendadas...
                </p>
              </div>
            )}

            {/* Estado Vacío */}
            {!loading && citas.length === 0 && (
              <div className="text-center py-16 px-6 bg-card rounded-2xl border border-line shadow-card max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-soft flex items-center justify-center text-rose mx-auto mb-4">
                  <CalendarHeart size={28} />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-2">
                  Aún no has creado ninguna cita
                </h3>
                <p className="text-ink-soft text-sm leading-relaxed mb-6">
                  Sorprende a tu novia diseñando la primera velada romántica, con
                  lugar, temática y ubicación en mapa.
                </p>
                <button
                  onClick={() => setCurrentView("create")}
                  className="bg-ink text-white font-semibold text-sm py-3 px-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Sparkles size={16} className="text-gold" />
                  <span>Crear la primera cita</span>
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
              <span className="font-sans font-semibold">+ Nueva cita</span>
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
