import { ICitaResponse } from "@/types";

/**
 * Genera la URL para agregar el evento directamente a Google Calendar
 * sin necesidad de descargar archivos ni iniciar sesión adicional.
 */
export function generateGoogleCalendarUrl(cita: ICitaResponse): string {
  const startDate = new Date(cita.horario);
  // Asumir duración estándar de 3 horas para la cita
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatGCalDate = (date: Date): string => {
    return date
      .toISOString()
      .replace(/-|:|\.\d+/g, "")
      .slice(0, 15) + "Z";
  };

  const startFormatted = formatGCalDate(startDate);
  const endFormatted = formatGCalDate(endDate);

  const details = `${cita.descripcion}\n\nVestimenta recomendada: ${cita.vestimentaRecomendada}\nTemática: ${cita.tematica}\n\nOrganizado con amor en Nuestras Aventuras`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Nuestras Aventuras: ${cita.nombre}`,
    dates: `${startFormatted}/${endFormatted}`,
    details: details,
    location: cita.lugar.direccion,
    sprop: "name:Nuestras Aventuras",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera el contenido en formato estándar iCalendar (.ics)
 * compatible con Apple Calendar, Google Calendar, Outlook, etc.
 */
export function generateIcsContent(cita: ICitaResponse): string {
  const startDate = new Date(cita.horario);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatIcsDate = (date: Date): string => {
    return (
      date
        .toISOString()
        .replace(/-|:|\.\d+/g, "")
        .slice(0, 15) + "Z"
    );
  };

  const uid = `nuestras-aventuras-${cita.id || Date.now()}@nuestrasaventuras.app`;
  const now = formatIcsDate(new Date());
  const start = formatIcsDate(startDate);
  const end = formatIcsDate(endDate);

  const summary = `Nuestras Aventuras: ${cita.nombre.replace(/,/g, "\\,")}`;
  const location = cita.lugar.direccion.replace(/,/g, "\\,");
  const description = `${cita.descripcion}\\n\\nVestimenta: ${cita.vestimentaRecomendada}\\nTemática: ${cita.tematica}\\nOrganizado en Nuestras Aventuras`.replace(
    /\n/g,
    "\\n"
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nuestras Aventuras//Diario de Citas y Viajes//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `GEO:${cita.lugar.lat};${cita.lugar.lng}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Descarga directamente el archivo .ics en el navegador del usuario.
 */
export function downloadIcsFile(cita: ICitaResponse) {
  const content = generateIcsContent(cita);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename = `nuestras-aventuras-${cita.nombre.toLowerCase().replace(/\s+/g, "-")}.ics`;

  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
