import { Document, Types } from "mongoose";

export type RolUsuario = "novio" | "novia";

export type EstadoCita =
  | "pendiente"
  | "aceptada"
  | "rechazada"
  | "confirmada"
  | "cancelada";

export type TematicaCita =
  | "Romántico"
  | "Casual"
  | "Aventura"
  | "Cultural"
  | "Formal"
  | string;

export type TipoAcompanantes =
  | "solo_pareja"
  | "mayoria_conocidos"
  | "mayoria_desconocidos";

export type ImportanciaCita = "especial" | "alta" | "media" | "casual";

export type AmbienteCita = "interior" | "exterior" | "mixto";

export interface ILugar {
  direccion: string;
  lat: number;
  lng: number;
}

export interface IAsistencia {
  cantidadPersonas: number;
  tipoAcompanantes: TipoAcompanantes;
  hayFamilia: boolean;
}

export interface IPropuestaCambio {
  nuevoHorario: string;
  motivo?: string;
  fechaSolicitud?: string;
  estado: "pendiente" | "aceptada" | "rechazada";
}

export interface IRecuerdo {
  fotoUrl: string;
  pieDeFoto?: string;
  fechaSubida?: string;
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
  asistencia?: IAsistencia;
  importancia?: ImportanciaCita;
  ambiente?: AmbienteCita;
  esFlexible?: boolean;
  propuestaCambio?: {
    nuevoHorario: Date;
    motivo?: string;
    fechaSolicitud: Date;
    estado: "pendiente" | "aceptada" | "rechazada";
  };
  recuerdo?: IRecuerdo;
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
  asistencia?: IAsistencia;
  importancia?: ImportanciaCita;
  ambiente?: AmbienteCita;
  esFlexible?: boolean;
  propuestaCambio?: IPropuestaCambio;
  recuerdo?: IRecuerdo;
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
