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
  // Inicialización síncrona inmediata desde almacenamiento local (cero parpadeo de login)
  const [user, setUser] = useState<IUsuarioResponse | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("velada_user");
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.debug("Error leyendo velada_user inicial:", e);
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("velada_token") || null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("velada_token");
    }
    return true;
  });

  const [pareja, setPareja] = useState<IParejaResponse | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("velada_pareja");
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.debug("Error leyendo velada_pareja inicial:", e);
      }
    }
    return null;
  });

  const [parejaLoading, setParejaLoading] = useState<boolean>(false);

  const saveSession = useCallback(
    (newToken: string, newUser: IUsuarioResponse, newPareja?: IParejaResponse | null) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("velada_token", newToken);
        localStorage.setItem("velada_user", JSON.stringify(newUser));
        if (newPareja) {
          localStorage.setItem("velada_pareja", JSON.stringify(newPareja));
        }
      }
    },
    []
  );

  const clearSession = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("velada_token");
      localStorage.removeItem("velada_user");
      localStorage.removeItem("velada_pareja");
    }
    setUser(null);
    setToken(null);
    setPareja(null);
  }, []);

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
          if (typeof window !== "undefined") {
            localStorage.setItem("velada_pareja", JSON.stringify(json.data));
          }
        }
      }
    } catch (err) {
      console.error("Error al consultar estado de pareja:", err);
    } finally {
      setParejaLoading(false);
    }
  }, []);

  // Restaurar y validar sesión con el servidor en segundo plano
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const savedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("velada_token")
            : null;

        if (savedToken) {
          setToken(savedToken);
          // Consulta silenciosa al servidor para refrescar datos
          const res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.success && data.usuario) {
              setUser(data.usuario);
              saveSession(savedToken, data.usuario);
              fetchParejaEstado(savedToken);
            }
          } else if (res.status === 401 || res.status === 403) {
            // Solo si el servidor rechaza explícitamente el token por inválido se borra
            if (isMounted) {
              clearSession();
            }
          }
          // NOTA: Si hay fallo de red u offline, NO se borra la sesión guardada
        }
      } catch (err) {
        console.debug("Modo sin conexión o retraso de red al verificar sesión:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchParejaEstado, saveSession, clearSession]);

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
      saveSession(data.token, data.usuario);
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
      saveSession(data.token, data.usuario);
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
      clearSession();
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

