"use client";

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { ICitaResponse } from "@/types";

/**
 * Utilidad para detectar si la aplicación está ejecutándose como
 * aplicación nativa instalada en Android (Capacitor) o en navegador web.
 */
export const isNativeAndroid = (): boolean => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
};

/**
 * Inicializa la configuración visual de la barra de estado de Android.
 */
export const initializeMobileStatusBar = async (): Promise<void> => {
  if (!isNativeAndroid()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#162738" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (err) {
    console.warn("[MobileNative] No se pudo configurar StatusBar:", err);
  }
};

/**
 * Emite una vibración háptica sutil en el teléfono físico.
 */
export const triggerHaptic = async (
  type: "light" | "medium" | "heavy" | "success" | "warning" = "light"
): Promise<void> => {
  if (!isNativeAndroid()) return;
  try {
    switch (type) {
      case "light":
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case "medium":
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case "heavy":
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case "success":
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case "warning":
        await Haptics.notification({ type: NotificationType.Warning });
        break;
    }
  } catch (err) {
    // Si el hardware no soporta hápticos o está bloqueado, silenciar
    console.debug("[MobileNative] Haptic no disponible:", err);
  }
};

/**
 * Programa recordatorios locales nativos en el sistema operativo Android
 * para una cita agendada (24 horas antes y 2 horas antes).
 */
export const scheduleCitaReminders = async (cita: ICitaResponse): Promise<boolean> => {
  if (!isNativeAndroid()) return false;

  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") {
        return false;
      }
    }

    const citaDate = new Date(cita.horario);
    const now = new Date();

    const notificationsToSchedule = [];

    const citaId = cita.id || (cita as any)._id || Math.random().toString();

    // Generar un ID numérico determinista a partir del ID de la cita
    const baseId = Math.abs(
      citaId.split("").reduce((acc: number, char: string) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ) % 100000;

    // 1. Recordatorio 24 horas antes
    const time24hBefore = new Date(citaDate.getTime() - 24 * 60 * 60 * 1000);
    if (time24hBefore > now) {
      notificationsToSchedule.push({
        title: `💌 Mañana: ${cita.nombre}`,
        body: `Vestimenta sugerida: ${cita.vestimentaRecomendada || "Elegante y romántica"} · En ${cita.lugar.direccion}`,
        id: baseId + 1,
        schedule: { at: time24hBefore },
        sound: "beep.wav",
        extra: { citaId },
      });
    }

    // 2. Recordatorio 2 horas antes
    const time2hBefore = new Date(citaDate.getTime() - 2 * 60 * 60 * 1000);
    if (time2hBefore > now) {
      notificationsToSchedule.push({
        title: `✨ En 2 horas: ${cita.nombre}`,
        body: `¡Es casi la hora de su velada! Lugar: ${cita.lugar.direccion}`,
        id: baseId + 2,
        schedule: { at: time2hBefore },
        sound: "beep.wav",
        extra: { citaId },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      return true;
    }

    return false;
  } catch (err) {
    console.warn("[MobileNative] Error programando notificaciones locales:", err);
    return false;
  }
};

/**
 * Abre la ubicación directamente en la aplicación nativa de Google Maps
 * de Android mediante el intent 'geo:' o enlace web estándar.
 */
export const openNativeLocation = (lat: number, lng: number, label?: string): void => {
  const query = encodeURIComponent(label || `${lat},${lng}`);
  if (isNativeAndroid()) {
    // Intent geo nativo de Android
    window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${query})`;
  } else {
    // Navegador web de escritorio
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  }
};
