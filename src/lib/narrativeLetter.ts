import { ICitaResponse } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface NarrativeParts {
  saludo: string;
  introduccion: string;
  descripcion: string;
  fechaTexto: string;
  horaTexto: string;
  lugarTexto: string;
  companiaTexto: string;
  ambienteTexto: string;
  vestimentaTexto: string;
  cierre: string;
  firma: string;
  posdata?: string;
}

export function generateNarrativeLetter(cita: ICitaResponse): NarrativeParts {
  let fechaTexto = "";
  let horaTexto = "";
  try {
    const d = new Date(cita.horario);
    fechaTexto = format(d, "EEEE d 'de' MMMM", { locale: es });
    fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    horaTexto = format(d, "h:mm a", { locale: es });
  } catch {
    fechaTexto = cita.horario;
    horaTexto = "";
  }

  // Compañía
  const personas = cita.asistencia?.cantidadPersonas || 2;
  let companiaTexto = "Será una cita exclusivamente para los dos, para disfrutar cada instante sin prisas.";
  if (personas > 2) {
    const acompanantes =
      cita.asistencia?.tipoAcompanantes === "mayoria_conocidos"
        ? "en su mayoría personas conocidas"
        : cita.asistencia?.tipoAcompanantes === "mayoria_desconocidos"
        ? "un ambiente nuevo con más personas"
        : "un grupo de acompañantes";
    const avisoFamilia = cita.asistencia?.hayFamilia
      ? " y nuestra familia ya está avisada"
      : "";
    companiaTexto = `Compartiremos esta experiencia con un grupo de ${personas} personas (${acompanantes}${avisoFamilia}), pero para mí tú serás siempre el centro de todo.`;
  }

  // Ambiente
  let ambienteTexto = "Estaremos en un espacio cerrado y acogedor.";
  if (cita.ambiente === "exterior") {
    ambienteTexto = "Estaremos al aire libre, disfrutando del cielo y la brisa.";
  } else if (cita.ambiente === "mixto") {
    ambienteTexto = "Estaremos en un lugar que combina lo mejor del interior con espacios abiertos.";
  }

  // Vestimenta
  const vestimentaTexto = cita.vestimentaRecomendada
    ? `Para que te sientas cómoda y radiante, te sugiero vestir ${cita.vestimentaRecomendada.trim()}. Aunque sabes que con cualquier cosa que elijas te verás espectacular.`
    : "Vístete con aquello que te haga sentir más linda y libre; para mí siempre serás la más hermosa.";

  // Saludo según importancia
  const saludo =
    cita.importancia === "especial"
      ? "Para el gran amor de mi vida,"
      : "Mi niña hermosa,";

  // Introducción según temática
  const introduccion =
    cita.importancia === "especial"
      ? `Hay momentos que merecen detener el tiempo y celebrarnos. He preparado con toda mi ilusión una cita muy especial llamada «${cita.nombre}».`
      : `He estado pensando mucho en ti y quise preparar algo lindo para nosotros: «${cita.nombre}».`;

  const descripcion = cita.descripcion;
  const lugarTexto = cita.lugar?.direccion || "Un lugar sorpresa";

  const cierre =
    "Nada me haría más feliz que compartir este momento contigo. ¿Me concederías el honor de acompañarme?";
  const firma = "Con todo mi amor, tu novio 💙";

  const posdata = cita.esFlexible
    ? "P.D.: Si por alguna razón la hora se te complica, amor, dímelo con confianza y encontramos el mejor momento para los dos."
    : undefined;

  return {
    saludo,
    introduccion,
    descripcion,
    fechaTexto,
    horaTexto,
    lugarTexto,
    companiaTexto,
    ambienteTexto,
    vestimentaTexto,
    cierre,
    firma,
    posdata,
  };
}
