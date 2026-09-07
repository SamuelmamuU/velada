"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { Seal } from "@/components/ui/Seal";
import { RolUsuario } from "@/types";
import { ShieldAlert } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: RolUsuario[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ivory p-6">
        <Seal size="lg" className="animate-pulse mb-4" />
        <p className="font-serif text-ink text-base">Cargando Nuestras Aventuras...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ivory">
        <div className="max-w-md bg-card rounded-2xl p-8 border border-line text-center shadow-velada">
          <ShieldAlert className="w-12 h-12 text-rose mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-semibold mb-2">Acceso Restringido</h2>
          <p className="text-ink-soft text-sm mb-6">
            Esta sección es exclusiva para el rol {allowedRoles.join(" o ")}. Tu cuenta actual tiene rol &ldquo;{user.rol}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
