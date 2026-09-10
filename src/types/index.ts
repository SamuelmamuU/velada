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

export interface IPareja {
  _id?: Types.ObjectId | string;
  id?: string;
  codigoVinculacion: string;
  novioId?: Types.ObjectId | string | null;
  noviaId?: Types.ObjectId | string | null;
  estado: "esperando_pareja" | "conectados";
  fechaVinculacion?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IParejaDocument extends Omit<IPareja, "_id" | "id" | "novioId" | "noviaId">, Document {
  _id: Types.ObjectId;
  novioId?: Types.ObjectId | null;
  noviaId?: Types.ObjectId | null;
}


export interface IParejaResponse {
  id: string;
  codigoVinculacion: string;
  estado: "esperando_pareja" | "conectados";
  parejaNombre?: string;
  parejaEmail?: string;
  parejaRol?: RolUsuario;
  fechaVinculacion?: string;
}

export interface IUsuario {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  parejaId?: Types.ObjectId | string | null;
  codigoVinculacion?: string;
  avatarUrl?: string;
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
  parejaId?: string | null;
  codigoVinculacion?: string;
  estadoPareja?: "esperando_pareja" | "conectados";
  nombrePareja?: string;
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
  parejaId?: Types.ObjectId | string | null;
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
  parejaId?: string | null;
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
  parejaId?: string | null;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

