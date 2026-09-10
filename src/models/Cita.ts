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

const AsistenciaSchema = new Schema(
  {
    cantidadPersonas: {
      type: Number,
      default: 2,
      min: [2, "Mínimo 2 personas"],
    },
    tipoAcompanantes: {
      type: String,
      enum: ["solo_pareja", "mayoria_conocidos", "mayoria_desconocidos"],
      default: "solo_pareja",
    },
    hayFamilia: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const PropuestaCambioSchema = new Schema(
  {
    nuevoHorario: {
      type: Date,
      required: true,
    },
    motivo: {
      type: String,
      trim: true,
    },
    fechaSolicitud: {
      type: Date,
      default: Date.now,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aceptada", "rechazada"],
      default: "pendiente",
    },
  },
  { _id: false }
);

const RecuerdoSchema = new Schema(
  {
    fotoUrl: {
      type: String,
      required: [true, "La foto del recuerdo es obligatoria"],
    },
    pieDeFoto: {
      type: String,
      trim: true,
    },
    fechaSubida: {
      type: Date,
      default: Date.now,
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
        values: ["pendiente", "aceptada", "rechazada", "confirmada", "cancelada"],
        message:
          "El estado debe ser 'pendiente', 'aceptada', 'rechazada', 'confirmada' o 'cancelada'",
      },
      default: "pendiente",
      index: true,
    },
    asistencia: {
      type: AsistenciaSchema,
      default: () => ({
        cantidadPersonas: 2,
        tipoAcompanantes: "solo_pareja",
        hayFamilia: false,
      }),
    },
    importancia: {
      type: String,
      enum: ["especial", "alta", "media", "casual"],
      default: "alta",
    },
    ambiente: {
      type: String,
      enum: ["interior", "exterior", "mixto"],
      default: "interior",
    },
    esFlexible: {
      type: Boolean,
      default: true,
    },
    propuestaCambio: {
      type: PropuestaCambioSchema,
      default: undefined,
    },
    recuerdo: {
      type: RecuerdoSchema,
      default: undefined,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: [true, "El usuario creador es obligatorio"],
      index: true,
    },
    parejaId: {
      type: Schema.Types.ObjectId,
      ref: "Pareja",
      default: null,
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
CitaSchema.index({ parejaId: 1, horario: 1 });


export const Cita: Model<ICitaDocument> =
  mongoose.models.Cita || mongoose.model<ICitaDocument>("Cita", CitaSchema);

export default Cita;
