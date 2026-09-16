import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IRecuerdoDocument extends Document {
  _id: Types.ObjectId;
  fotoUrl: string;
  pieDeFoto?: string;
  fecha: Date;
  creadoPor: Types.ObjectId;
  parejaId?: Types.ObjectId | null;
  citaId?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecuerdoSchema = new Schema<IRecuerdoDocument>(
  {
    fotoUrl: {
      type: String,
      required: [true, "La foto es obligatoria"],
    },
    pieDeFoto: {
      type: String,
      trim: true,
      default: "",
    },
    fecha: {
      type: Date,
      default: Date.now,
      index: true,
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    parejaId: {
      type: Schema.Types.ObjectId,
      ref: "Pareja",
      default: null,
      index: true,
    },
    citaId: {
      type: Schema.Types.ObjectId,
      ref: "Cita",
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

RecuerdoSchema.index({ parejaId: 1, fecha: -1 });

export const Recuerdo: Model<IRecuerdoDocument> =
  mongoose.models.Recuerdo || mongoose.model<IRecuerdoDocument>("Recuerdo", RecuerdoSchema);

export default Recuerdo;
