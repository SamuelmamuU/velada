"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Seal } from "@/components/ui/Seal";
import { RolUsuario } from "@/types";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();

  const [role, setRole] = useState<RolUsuario>("novio");
  const [email, setEmail] = useState("novio@velada.app");
  const [password, setPassword] = useState("NovioVelada2026!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (selectedRole: RolUsuario) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === "novio") {
      setEmail("novio@velada.app");
      setPassword("NovioVelada2026!");
    } else {
      setEmail("novia@velada.app");
      setPassword("NoviaVelada2026!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "No se pudo iniciar sesión. Verifica tus credenciales.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ivory">
      <div className="w-full max-w-[390px] bg-card rounded-[20px] shadow-velada p-9 sm:p-10 text-center border border-line animate-fade-up">
        {/* Sello de Cera */}
        <div className="flex justify-center mb-4">
          <Seal size="lg" />
        </div>

        <h1 className="font-serif text-[28px] font-semibold text-ink tracking-tight mb-1.5">
          Velada
        </h1>
        <p className="text-ink-soft text-[14px] leading-relaxed mb-7 font-normal">
          Cada cita, una pequeña invitación.
          <br />
          Inicia sesión para continuar.
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-soft/50 border border-rose/30 text-ink text-left text-xs flex items-start gap-2 animate-fade-up">
            <AlertCircle size={16} className="text-rose flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Selector de Rol */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => handleRoleChange("novio")}
              className={`flex-1 py-3 px-2 rounded-xl border text-[13px] font-semibold text-center transition-all ${
                role === "novio"
                  ? "border-rose bg-rose-soft text-ink shadow-sm"
                  : "border-line text-ink-soft hover:border-ink/20"
              }`}
            >
              Soy el Novio
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("novia")}
              className={`flex-1 py-3 px-2 rounded-xl border text-[13px] font-semibold text-center transition-all ${
                role === "novia"
                  ? "border-rose bg-rose-soft text-ink shadow-sm"
                  : "border-line text-ink-soft hover:border-ink/20"
              }`}
            >
              Soy la Novia
            </button>
          </div>

          {/* Campo Correo */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Correo
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full py-3 px-3.5 pl-10 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft opacity-60"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 px-3.5 pl-10 border border-line rounded-[10px] font-sans text-sm bg-ivory text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft opacity-60"
              />
            </div>
          </div>

          {/* Botón de Entrada */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white font-sans font-semibold text-sm py-3.5 px-5 rounded-xl hover:-translate-y-0.5 hover:shadow-[0_10px_18px_-8px_rgba(43,36,56,0.5)] transition-all duration-150 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
