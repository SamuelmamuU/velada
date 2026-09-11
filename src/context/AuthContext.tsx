"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { IUsuarioResponse, IParejaResponse, RolUsuario } from "@/types";

interface AuthContextType {
  user: IUsuarioResponse | null;
  token: string | null;
  loading: boolean;
  pareja: IParejaResponse | null;
  parejaLoading: boolean;
  login: (
    email: string,
    password: string,
    options?: { delayCommitMs?: number; onPreCommit?: () => void }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: {
      nombre: string;
      email: string;
      password: string;
      rol: RolUsuario;
    },
    options?: { delayCommitMs?: number; onPreCommit?: () => void }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: RolUsuario) => Promise<boolean>;
  refreshPareja: () => Promise<void>;
  vincularPareja: (codigo: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  desvincularPareja: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUsuarioResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pareja, setPareja] = useState<IParejaResponse | null>(null);
  const [parejaLoading, setParejaLoading] = useState<boolean>(false);

  const fetchParejaEstado = useCallback(async (authToken?: string) => {
    const currentToken =
      authToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("velada_token")
        : null);
    if (!currentToken) {
      setPareja(null);
      return;
    }

    try {
      setParejaLoading(true);
      const res = await fetch("/api/pareja/estado", {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPareja(json.data);
        }
      }
    } catch (err) {
      console.error("Error al consultar estado de pareja:", err);
    } finally {
      setParejaLoading(false);
    }
  }, []);

  // Restaurar sesión al cargar la página
  useEffect(() => {
    let isMounted = true;

    // Temporizador de seguridad: nunca quedarse en loading más de 3 segundos
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        const savedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("velada_token")
            : null;
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
            if (isMounted && data.success && data.usuario) {
              setUser(data.usuario);
              fetchParejaEstado(savedToken);
            } else if (isMounted) {
              localStorage.removeItem("velada_token");
              setToken(null);
              setUser(null);
              setPareja(null);
            }
          } else if (isMounted) {
            localStorage.removeItem("velada_token");
            setToken(null);
            setUser(null);
            setPareja(null);
          }
        }
      } catch (err) {
        console.error("Error al restaurar sesión:", err);
      } finally {
        clearTimeout(fallbackTimer);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [fetchParejaEstado]);

  const login = async (
    email: string,
    password: string,
    options?: { delayCommitMs?: number; onPreCommit?: () => void }
  ) => {
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

      if (options?.onPreCommit) {
        options.onPreCommit();
      }
      if (options?.delayCommitMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayCommitMs));
      }

      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem("velada_token", data.token);
      fetchParejaEstado(data.token);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error de conexión con el servidor" };
    }
  };

  const register = async (
    userData: {
      nombre: string;
      email: string;
      password: string;
      rol: RolUsuario;
    },
    options?: { delayCommitMs?: number; onPreCommit?: () => void }
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Error al crear la cuenta" };
      }

      if (options?.onPreCommit) {
        options.onPreCommit();
      }
      if (options?.delayCommitMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayCommitMs));
      }

      setToken(data.token);
      setUser(data.usuario);
      localStorage.setItem("velada_token", data.token);
      fetchParejaEstado(data.token);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error al conectar con el servidor" };
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
      setPareja(null);
      localStorage.removeItem("velada_token");
    }
  };

  const switchDemoRole = async (role: RolUsuario) => {
    const email = role === "novio" ? "novio@velada.app" : "novia@velada.app";
    const password = role === "novio" ? "NovioVelada2026!" : "NoviaVelada2026!";
    const res = await login(email, password);
    return res.success;
  };

  const refreshPareja = useCallback(async () => {
    await fetchParejaEstado();
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("velada_token") : null);
    if (currentToken) {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.usuario) {
          setUser(json.usuario);
        }
      }
    }
  }, [fetchParejaEstado, token]);

  const vincularPareja = useCallback(async (codigo: string) => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("velada_token") : null);
    if (!currentToken) {
      return { success: false, error: "No hay sesión activa" };
    }

    try {
      const res = await fetch("/api/pareja/vincular", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ codigo }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "No se pudo vincular la cuenta" };
      }

      await refreshPareja();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || "Error al conectar con el servidor" };
    }
  }, [token, refreshPareja]);

  const desvincularPareja = useCallback(async () => {
    const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("velada_token") : null);
    if (!currentToken) return { success: false, error: "No hay sesión activa" };

    try {
      const res = await fetch("/api/pareja/desvincular", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Error al desvincular la cuenta" };
      }

      await refreshPareja();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error al conectar con el servidor" };
    }
  }, [token, refreshPareja]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pareja,
        parejaLoading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshPareja,
        vincularPareja,
        desvincularPareja,
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

