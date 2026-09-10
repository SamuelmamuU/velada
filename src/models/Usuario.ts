import mongoose, { Schema, Model } from "mongoose";
import { IUsuarioDocument } from "@/types";

const UsuarioSchema = new Schema<IUsuarioDocument>(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },
    email: {
      type: String,
      required: [true, "El correo electrónico es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Por favor ingresa un correo electrónico válido",
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    },
    rol: {
      type: String,
      enum: {
        values: ["novio", "novia"],
        message: "El rol debe ser 'novio' o 'novia'",
      },
      required: [true, "El rol es obligatorio"],
    },
    parejaId: {
      type: Schema.Types.ObjectId,
      ref: "Pareja",
      default: null,
      index: true,
    },
    codigoVinculacion: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    avatarUrl: {
      type: String,
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
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Evitar recompilación de modelo en Next.js hot reload
export const Usuario: Model<IUsuarioDocument> =
  mongoose.models.Usuario || mongoose.model<IUsuarioDocument>("Usuario", UsuarioSchema);

export default Usuario;
