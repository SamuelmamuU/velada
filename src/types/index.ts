import { Document, Types } from "mongoose";

export type RolUsuario = "novio" | "novia";

export type EstadoCita = "pendiente" | "confirmada" | "cancelada";

export type TematicaCita =
  | "Romántico"
  | "Casual"
  | "Aventura"
  | "Cultural"
  | "Formal"
  | string;

export interface ILugar {
  direccion: string;
  lat: number;
  lng: number;
}

export interface IUsuario {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUsuarioDocument extends IUsuario, Document {
  _id: Types.ObjectId;
}

export interface IUsuarioResponse {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  createdAt?: string;
}

export interface ICita {
  nombre: string;
  descripcion: string;
  horario: Date;
  lugar: ILugar;
  tematica: TematicaCita;
  vestimentaRecomendada: string;
  estado: EstadoCita;
  creadoPor: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICitaDocument extends ICita, Document {
  _id: Types.ObjectId;
}

export interface ICitaResponse {
  id: string;
  nombre: string;
  descripcion: string;
  horario: string;
  lugar: ILugar;
  tematica: string;
  vestimentaRecomendada: string;
  estado: EstadoCita;
  creadoPor?: {
    id: string;
    nombre: string;
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  rol: RolUsuario;
  nombre: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
