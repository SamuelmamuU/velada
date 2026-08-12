"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUsuarioResponse, RolUsuario } from "@/types";

interface AuthContextType {
  user: IUsuarioResponse | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: RolUsuario) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUsuarioResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Restaurar sesión al cargar la página
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("velada_token");
        if (savedToken) {
          setToken(savedToken);
          // Verificar token con el backend
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.usuario) {
              setUser(data.usuario);
            } else {
              localStorage.removeItem("velada_token");
              setToken(null);
              setUser(null);
            }
          } else {
            localStorage.removeItem("velada_token");
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.error("Error al restaurar sesión:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Error al iniciar sesión" };
      }

      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem("velada_token", data.token);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error de conexión con el servidor" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("velada_token");
    }
  };

  const switchDemoRole = async (role: RolUsuario) => {
    const email = role === "novio" ? "novio@velada.app" : "novia@velada.app";
    const password = role === "novio" ? "NovioVelada2026!" : "NoviaVelada2026!";
    const res = await login(email, password);
    return res.success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
