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
    .enum(["pendiente", "confirmada", "cancelada"], {
      errorMap: () => ({
        message: "El estado debe ser 'pendiente', 'confirmada' o 'cancelada'",
      }),
    })
    .optional()
    .default("confirmada"),
});

export const EditarCitaSchema = CrearCitaSchema.partial();
