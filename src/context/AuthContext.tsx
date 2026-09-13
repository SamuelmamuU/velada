"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { IUsuarioResponse, IParejaResponse, RolUsuario } from "@/types";
import { sendImmediateNotification } from "@/lib/mobileNative";

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
  updateProfile: (data: {
    nombre?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
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
  const prevParejaEstadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (pareja?.estado) {
      prevParejaEstadoRef.current = pareja.estado;
    }
  }, [pareja]);

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
          const newPareja: IParejaResponse = json.data;
          const prevEstado = prevParejaEstadoRef.current;

          // Si antes no estaba conectado y ahora sí está conectado, notificar al usuario que esperaba
          if (
            prevEstado &&
            prevEstado !== "conectados" &&
            newPareja.estado === "conectados"
          ) {
            const partnerName = newPareja.parejaNombre || "Tu pareja";
            sendImmediateNotification({
              title: "💞 ¡Cuentas vinculadas con éxito!",
              body: `¡${partnerName} se ha vinculado contigo! Ahora comparten su diario y buzón de aventuras.`,
              extra: { type: "pairing_success" },
            });
          }

          prevParejaEstadoRef.current = newPareja.estado;
          setPareja(newPareja);
          if (typeof window !== "undefined") {
            localStorage.setItem("velada_pareja", JSON.stringify(newPareja));
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
      sendImmediateNotification({
        title: "💞 ¡Cuentas vinculadas con éxito!",
        body: `¡Te has vinculado exitosamente con tu pareja! Ahora comparten su diario y cartas de amor.`,
        extra: { type: "pairing_success" },
      });
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

  const updateProfile = useCallback(
    async (data: {
      nombre?: string;
      avatarUrl?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      const currentToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("velada_token")
          : null);

      if (!currentToken) {
        return { success: false, error: "No hay sesión activa" };
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(data),
        });

        const resData = await res.json();
        if (!res.ok || !resData.success) {
          return {
            success: false,
            error: resData.error || "Error al actualizar perfil",
          };
        }

        if (resData.usuario) {
          setUser(resData.usuario);
          saveSession(currentToken, resData.usuario);
        }

        return {
          success: true,
          message: resData.message || "Perfil actualizado con éxito",
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message || "Error al conectar con el servidor",
        };
      }
    },
    [token, saveSession]
  );

  // Sondeo periódico del estado de vinculación si la cuenta aún no está conectada
  useEffect(() => {
    if (!token || (pareja && pareja.estado === "conectados")) return;

    const interval = setInterval(() => {
      fetchParejaEstado();
    }, 6000);

    const handleSync = () => {
      fetchParejaEstado();
    };
    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, [token, pareja, fetchParejaEstado]);

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
        updateProfile,
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

