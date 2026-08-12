import mongoose, { Schema, Model } from "mongoose";
import { ICitaDocument } from "@/types";

const LugarSchema = new Schema(
  {
    direccion: {
      type: String,
      required: [true, "La dirección del lugar es obligatoria"],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, "La latitud es obligatoria"],
      min: [-90, "Latitud inválida"],
      max: [90, "Latitud inválida"],
    },
    lng: {
      type: Number,
      required: [true, "La longitud es obligatoria"],
      min: [-180, "Longitud inválida"],
      max: [180, "Longitud inválida"],
    },
  },
  { _id: false }
);

const CitaSchema = new Schema<ICitaDocument>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la cita es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
    },
    horario: {
      type: Date,
      required: [true, "El horario de la cita es obligatorio"],
      index: true,
    },
    lugar: {
      type: LugarSchema,
      required: [true, "La información del lugar es obligatoria"],
    },
    tematica: {
      type: String,
      required: [true, "La temática es obligatoria"],
      trim: true,
    },
    vestimentaRecomendada: {
      type: String,
      required: [true, "La vestimenta recomendada es obligatoria"],
      trim: true,
    },
    estado: {
      type: String,
      enum: {
        values: ["pendiente", "confirmada", "cancelada"],
        message: "El estado debe ser 'pendiente', 'confirmada' o 'cancelada'",
      },
      default: "confirmada",
      index: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El usuario creador es obligatorio"],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Índices compuestos y optimizados
CitaSchema.index({ horario: 1, estado: 1 });
CitaSchema.index({ creadoPor: 1, horario: 1 });

export const Cita: Model<ICitaDocument> =
  mongoose.models.Cita || mongoose.model<ICitaDocument>("Cita", CitaSchema);

export default Cita;
