import mongoose, { Schema, Model } from "mongoose";
import { IParejaDocument } from "@/types";

const ParejaSchema = new Schema<IParejaDocument>(
  {
    codigoVinculacion: {
      type: String,
      required: [true, "El código de vinculación es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    novioId: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
      index: true,
    },
    noviaId: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
      index: true,
    },
    estado: {
      type: String,
      enum: {
        values: ["esperando_pareja", "conectados"],
        message: "El estado debe ser 'esperando_pareja' o 'conectados'",
      },
      default: "esperando_pareja",
      index: true,
    },
    fechaVinculacion: {
      type: Date,
      default: null,
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

export const Pareja: Model<IParejaDocument> =
  mongoose.models.Pareja || mongoose.model<IParejaDocument>("Pareja", ParejaSchema);

export default Pareja;
