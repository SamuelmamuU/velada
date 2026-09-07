import { z } from "zod";

export const LugarSchema = z.object({
  direccion: z
    .string({ required_error: "La dirección es obligatoria" })
    .min(1, "La dirección no puede estar vacía")
    .trim(),
  lat: z
    .number({ required_error: "La latitud es obligatoria" })
    .min(-90, "Latitud inválida")
    .max(90, "Latitud inválida"),
  lng: z
    .number({ required_error: "La longitud es obligatoria" })
    .min(-180, "Longitud inválida")
    .max(180, "Longitud inválida"),
});

export const AsistenciaSchema = z
  .object({
    cantidadPersonas: z
      .number()
      .min(2, "Mínimo 2 personas")
      .optional()
      .default(2),
    tipoAcompanantes: z
      .enum(["solo_pareja", "mayoria_conocidos", "mayoria_desconocidos"])
      .optional()
      .default("solo_pareja"),
    hayFamilia: z.boolean().optional().default(false),
  })
  .optional();

export const CrearCitaSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre de la cita es obligatorio" })
    .min(1, "El nombre de la cita no puede estar vacío")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  descripcion: z
    .string({ required_error: "La descripción es obligatoria" })
    .min(1, "La descripción no puede estar vacía")
    .trim(),
  horario: z
    .string({ required_error: "El horario es obligatorio" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Formato de fecha u horario inválido",
    }),
  lugar: LugarSchema,
  tematica: z
    .string({ required_error: "La temática es obligatoria" })
    .min(1, "La temática no puede estar vacía")
    .trim(),
  vestimentaRecomendada: z
    .string({ required_error: "La vestimenta recomendada es obligatoria" })
    .min(1, "La vestimenta recomendada no puede estar vacía")
    .trim(),
  estado: z
    .enum(["pendiente", "aceptada", "rechazada", "confirmada", "cancelada"], {
      errorMap: () => ({
        message:
          "El estado debe ser 'pendiente', 'aceptada', 'rechazada', 'confirmada' o 'cancelada'",
      }),
    })
    .optional()
    .default("pendiente"),
  asistencia: AsistenciaSchema,
  importancia: z
    .enum(["especial", "alta", "media", "casual"])
    .optional()
    .default("alta"),
  ambiente: z
    .enum(["interior", "exterior", "mixto"])
    .optional()
    .default("interior"),
  esFlexible: z.boolean().optional().default(true),
});

export const EditarCitaSchema = CrearCitaSchema.partial();

export const PropuestaCambioSchema = z.object({
  nuevoHorario: z
    .string({ required_error: "El nuevo horario propuesto es obligatorio" })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Formato de fecha u horario inválido",
    }),
  motivo: z.string().optional(),
});

export const ResponderCitaSchema = z.object({
  respuesta: z.enum(["aceptada", "rechazada", "pendiente"], {
    errorMap: () => ({
      message: "La respuesta debe ser 'aceptada', 'rechazada' o 'pendiente'",
    }),
  }),
});

export const RecuerdoSchema = z.object({
  fotoUrl: z
    .string({ required_error: "La foto del recuerdo es obligatoria" })
    .min(1, "La foto no puede estar vacía"),
  pieDeFoto: z.string().optional(),
});
