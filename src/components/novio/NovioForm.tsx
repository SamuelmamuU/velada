"use client";

import React, { useState, useEffect } from "react";
import { ICitaResponse, ILugar } from "@/types";
import { MapPicker } from "@/components/maps/MapPicker";
import { format } from "date-fns";
import { Loader2, AlertCircle, Sparkles, X } from "lucide-react";

interface NovioFormProps {
  initialCita?: ICitaResponse | null;
  token: string;
  onSuccess: (cita: ICitaResponse) => void;
  onCancel: () => void;
}

export function NovioForm({
  initialCita,
  token,
  onSuccess,
  onCancel,
}: NovioFormProps) {
  const isEditing = !!initialCita;

  // Estado del formulario
  const [nombre, setNombre] = useState(initialCita?.nombre || "");
  const [descripcion, setDescripcion] = useState(
    initialCita?.descripcion || ""
  );

  // Fecha y hora inicial
  let defaultDate = "";
  let defaultTime = "20:00";
  if (initialCita?.horario) {
    try {
      const d = new Date(initialCita.horario);
      defaultDate = format(d, "yyyy-MM-dd");
      defaultTime = format(d, "HH:mm");
    } catch {
      defaultDate = "";
    }
  } else {
    // Por defecto en 3 días
    const nextDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    defaultDate = format(nextDate, "yyyy-MM-dd");
  }

  const [fecha, setFecha] = useState(defaultDate);
  const [hora, setHora] = useState(defaultTime);
  const [tematica, setTematica] = useState(
    initialCita?.tematica || "Romántico"
  );
  const [vestimenta, setVestimenta] = useState(
    initialCita?.vestimentaRecomendada || ""
  );
  const [estado, setEstado] = useState(initialCita?.estado || "confirmada");

  // Lugar y coordenadas
  const [lugar, setLugar] = useState<ILugar>(
    initialCita?.lugar || {
      direccion: "Terraza San Pedro, San Pedro Garza García",
      lat: 25.6572,
      lng: -100.4024,
    }
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !descripcion.trim() || !fecha || !hora || !vestimenta.trim()) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    // Combinar fecha y hora en formato ISO UTC
    const combinedDate = new Date(`${fecha}T${hora}:00`);
    if (isNaN(combinedDate.getTime())) {
      setError("La fecha u hora seleccionada no es válida.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isEditing
        ? `/api/citas/${initialCita.id}`
        : "/api/citas";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        horario: combinedDate.toISOString(),
        lugar: {
          direccion: lugar.direccion.trim() || "Lugar por definir",
          lat: lugar.lat,
          lng: lugar.lng,
        },
        tematica,
        vestimentaRecomendada: vestimenta.trim(),
        estado,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo guardar la cita");
      }

      onSuccess(data.cita);
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-[20px] p-6 sm:p-9 shadow-velada border border-line max-w-[720px] mx-auto animate-fade-up">
      {/* Encabezado del Formulario */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.1em] text-gold-deep font-semibold mb-1">
            {isEditing ? "Modificar velada" : "Crear invitación"}
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
            {isEditing ? "Edita los detalles de la cita" : "Diseña la próxima cita"}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-paper transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-soft/60 border border-rose/30 text-ink text-xs flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nombre de la cita */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
            Nombre de la cita *
          </label>
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Cena bajo las luces"
            className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
            Descripción de la velada *
          </label>
          <textarea
            rows={3}
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuéntale de qué se trata la experiencia..."
            className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 resize-none"
          />
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Fecha *
            </label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Hora *
            </label>
            <input
              type="time"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>

        {/* Dirección del Lugar */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
            Lugar / Dirección *
          </label>
          <input
            type="text"
            required
            value={lugar.direccion}
            onChange={(e) =>
              setLugar({ ...lugar, direccion: e.target.value })
            }
            placeholder="Ej. Terraza San Pedro, Monterrey"
            className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>

        {/* Temática y Vestimenta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Temática *
            </label>
            <select
              value={tematica}
              onChange={(e) => setTematica(e.target.value)}
              className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            >
              <option value="Romántico">Romántico</option>
              <option value="Casual">Casual</option>
              <option value="Aventura">Aventura</option>
              <option value="Cultural">Cultural</option>
              <option value="Formal">Formal</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Vestimenta recomendada *
            </label>
            <input
              type="text"
              required
              value={vestimenta}
              onChange={(e) => setVestimenta(e.target.value)}
              placeholder="Ej. Elegante casual"
              className="w-full py-3 px-3.5 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>

        {/* Selector de Estado */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
            Estado de la Cita
          </label>
          <div className="flex gap-2">
            {(["confirmada", "pendiente", "cancelada"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setEstado(st)}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold uppercase font-mono transition-all ${
                  estado === st
                    ? st === "confirmada"
                      ? "bg-[#E4EFE2] text-[#3E7A3D] border border-[#3E7A3D]/40"
                      : st === "pendiente"
                      ? "bg-[#F6EAD2] text-gold-deep border border-gold-deep/40"
                      : "bg-rose-soft text-rose border border-rose/40"
                    : "bg-paper/70 text-ink-soft border border-line"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa Interactivo con Geocodificación */}
        <MapPicker
          value={lugar}
          onChange={(nuevoLugar) => setLugar(nuevoLugar)}
          searchQuery={lugar.direccion}
        />

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-4 border-t border-line">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-ink text-white font-semibold text-sm py-3.5 px-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Guardando cita...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="text-gold" />
                <span>{isEditing ? "Guardar cambios" : "Guardar y agendar cita"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-3.5 rounded-xl border border-line text-ink-soft hover:text-ink hover:bg-paper font-medium text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
