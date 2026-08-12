"use client";

import React, { useState } from "react";
import {
  ICitaResponse,
  ILugar,
  TipoAcompanantes,
  ImportanciaCita,
  AmbienteCita,
} from "@/types";
import { MapPicker } from "@/components/maps/MapPicker";
import { format } from "date-fns";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  Users,
  Home,
  Clock,
  Flame,
} from "lucide-react";

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

  // Campos básicos
  const [nombre, setNombre] = useState(initialCita?.nombre || "");
  const [descripcion, setDescripcion] = useState(
    initialCita?.descripcion || ""
  );

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

  // Nuevas funcionalidades solicitadas
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(
    initialCita?.asistencia?.cantidadPersonas || 2
  );
  const [tipoAcompanantes, setTipoAcompanantes] = useState<TipoAcompanantes>(
    initialCita?.asistencia?.tipoAcompanantes || "solo_pareja"
  );
  const [hayFamilia, setHayFamilia] = useState<boolean>(
    initialCita?.asistencia?.hayFamilia || false
  );

  const [importancia, setImportancia] = useState<ImportanciaCita>(
    initialCita?.importancia || "alta"
  );
  const [ambiente, setAmbiente] = useState<AmbienteCita>(
    initialCita?.ambiente || "interior"
  );
  const [esFlexible, setEsFlexible] = useState<boolean>(
    initialCita?.esFlexible ?? true
  );

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

  const handlePersonasChange = (num: number) => {
    setCantidadPersonas(num);
    if (num === 2) {
      setTipoAcompanantes("solo_pareja");
    } else if (tipoAcompanantes === "solo_pareja") {
      setTipoAcompanantes("mayoria_conocidos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !descripcion.trim() || !fecha || !hora || !vestimenta.trim()) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

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
        asistencia: {
          cantidadPersonas,
          tipoAcompanantes:
            cantidadPersonas === 2 ? "solo_pareja" : tipoAcompanantes,
          hayFamilia,
        },
        importancia,
        ambiente,
        esFlexible,
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
    <div className="bg-card rounded-[20px] p-6 sm:p-9 shadow-velada border border-line max-w-[760px] mx-auto animate-fade-up">
      {/* Encabezado */}
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

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* SECCIÓN NUEVA 1: Asistencia, Compañía y Familia */}
        <div className="bg-paper/50 rounded-2xl p-4 sm:p-5 border border-line space-y-4">
          <div className="flex items-center gap-2 text-ink font-serif font-semibold text-sm">
            <Users size={16} className="text-gold-deep" />
            <span>Compañía y Asistencia al Plan</span>
          </div>

          {/* Cantidad de personas */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-2">
              ¿Cuántas personas asistirán en total?
            </label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 6, 8, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePersonasChange(num)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                    cantidadPersonas === num
                      ? "bg-ink text-white shadow-sm"
                      : "bg-card text-ink-soft border border-line hover:border-ink/20"
                  }`}
                >
                  {num === 2 ? "Solo nosotros dos (2)" : `${num} personas`}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de acompañantes si son más de 2 */}
          {cantidadPersonas > 2 && (
            <div className="pt-2 border-t border-line/60">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-2">
                ¿Los demás asistentes son conocidos o desconocidos?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoAcompanantes("mayoria_conocidos")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                    tipoAcompanantes === "mayoria_conocidos"
                      ? "border border-rose bg-rose-soft text-ink"
                      : "bg-card border border-line text-ink-soft"
                  }`}
                >
                  👥 Mayoría conocidos (amigos/cercanos)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoAcompanantes("mayoria_desconocidos")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
                    tipoAcompanantes === "mayoria_desconocidos"
                      ? "border border-rose bg-rose-soft text-ink"
                      : "bg-card border border-line text-ink-soft"
                  }`}
                >
                  🎭 Mayoría desconocidos (evento/social)
                </button>
              </div>
            </div>
          )}

          {/* Aviso si hay familia */}
          <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-semibold text-ink">
                ¿Habrá familiares presentes?
              </div>
              <div className="text-[11px] text-ink-soft">
                Le ayuda a tu novia a saber si es un ambiente familiar.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHayFamilia(false)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                  !hayFamilia
                    ? "bg-card border border-ink text-ink"
                    : "bg-card/50 border border-line text-ink-soft"
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setHayFamilia(true)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all ${
                  hayFamilia
                    ? "bg-rose text-white border border-rose"
                    : "bg-card/50 border border-line text-ink-soft"
                }`}
              >
                Sí, con familia 👨‍👩‍👧
              </button>
            </div>
          </div>
        </div>

        {/* SECCIÓN NUEVA 2: Importancia, Ambiente y Flexibilidad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Importancia */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-2 flex items-center gap-1.5">
              <Flame size={13} className="text-rose" />
              <span>Importancia</span>
            </label>
            <select
              value={importancia}
              onChange={(e) => setImportancia(e.target.value as ImportanciaCita)}
              className="w-full py-2.5 px-3 border border-line rounded-[10px] font-sans text-xs bg-ivory text-ink focus:outline-none focus:border-gold"
            >
              <option value="especial">✨ Muy Especial / Crucial</option>
              <option value="alta">🌟 Alta Prioridad</option>
              <option value="media">💫 Media</option>
              <option value="casual">☕ Casual / Espontánea</option>
            </select>
          </div>

          {/* Ambiente Interior / Exterior */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-2 flex items-center gap-1.5">
              <Home size={13} className="text-gold-deep" />
              <span>Ambiente</span>
            </label>
            <select
              value={ambiente}
              onChange={(e) => setAmbiente(e.target.value as AmbienteCita)}
              className="w-full py-2.5 px-3 border border-line rounded-[10px] font-sans text-xs bg-ivory text-ink focus:outline-none focus:border-gold"
            >
              <option value="interior">🏠 Interior (Indoor)</option>
              <option value="exterior">🌳 Exterior (Outdoor)</option>
              <option value="mixto">🌤️ Mixto (Ambos)</option>
            </select>
          </div>

          {/* Flexibilidad de horario */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-2 flex items-center gap-1.5">
              <Clock size={13} className="text-gold" />
              <span>¿Horario flexible?</span>
            </label>
            <select
              value={esFlexible ? "true" : "false"}
              onChange={(e) => setEsFlexible(e.target.value === "true")}
              className="w-full py-2.5 px-3 border border-line rounded-[10px] font-sans text-xs bg-ivory text-ink focus:outline-none focus:border-gold"
            >
              <option value="true">⏱️ Sí, la novia puede proponer cambio</option>
              <option value="false">🔒 No, horario estricto / reservación</option>
            </select>
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
