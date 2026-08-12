"use client";

import { useEffect, useState } from "react";

interface PingResponse {
  status: string;
  message: string;
  app: string;
  version: string;
  timestamp: string;
}

export default function Home() {
  const [pingData, setPingData] = useState<PingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkPing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ping");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PingResponse = await res.json();
      setPingData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPing();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card rounded-[20px] shadow-velada p-10 text-center border border-line animate-fade-up">
        {/* Sello distintivo */}
        <div className="seal mx-auto mb-5">V</div>

        <h1 className="font-serif text-3xl font-semibold text-ink tracking-tight mb-2">
          Velada
        </h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-6 font-normal">
          Cada cita, una pequeña invitación.
          <br />
          <span className="text-xs text-gold-deep font-medium">
            Entorno inicial de desarrollo listo · Fase 0
          </span>
        </p>

        {/* Card de verificación de API */}
        <div className="bg-paper/70 rounded-xl p-4 text-left border border-line mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft font-semibold">
              Estado Backend / API
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                loading
                  ? "bg-amber-100 text-amber-800"
                  : pingData
                  ? "bg-[#E4EFE2] text-[#3E7A3D]"
                  : "bg-rose-soft text-rose"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  loading
                    ? "bg-amber-500 animate-pulse"
                    : pingData
                    ? "bg-[#3E7A3D]"
                    : "bg-rose"
                }`}
              />
              {loading ? "Conectando..." : pingData ? "En línea" : "Error"}
            </span>
          </div>

          {pingData && (
            <div className="space-y-1 font-mono text-xs text-ink-soft">
              <div>
                <span className="text-ink font-medium">Respuesta:</span>{" "}
                {pingData.message} ({pingData.app})
              </div>
              <div className="text-[11px] text-ink-soft/80 truncate">
                <span className="text-ink font-medium">Timestamp:</span>{" "}
                {new Date(pingData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          )}

          {error && (
            <div className="font-mono text-xs text-rose mt-1">
              Error: {error}
            </div>
          )}
        </div>

        <button
          onClick={checkPing}
          disabled={loading}
          className="w-full bg-ink text-white font-medium text-sm py-3 px-4 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150 active:translate-y-0 disabled:opacity-50"
        >
          {loading ? "Probando conexión..." : "Repetir Ping / Pong"}
        </button>

        <div className="mt-6 pt-4 border-t border-line text-[11px] font-mono text-ink-soft/70">
          Next.js App Router + TypeScript + Tailwind CSS
        </div>
      </div>
    </main>
  );
}
