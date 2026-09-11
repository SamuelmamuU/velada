import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
  lastFailedAt?: number;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    return null;
  }

  if (cached!.conn && cached!.conn.connection.readyState === 1) {
    return cached!.conn;
  }

  // Si falló recientemente (en los últimos 30 segundos), evitar bloquear esperando el timeout
  if (cached!.lastFailedAt && Date.now() - cached!.lastFailedAt < 30000) {
    return null;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 1500, // Timeout rápido para no bloquear en desarrollo local
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cached!.lastFailedAt = undefined;
        return m;
      })
      .catch(() => {
        cached!.promise = null;
        cached!.conn = null;
        cached!.lastFailedAt = Date.now();
        return null;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch {
    cached!.promise = null;
    cached!.conn = null;
    cached!.lastFailedAt = Date.now();
    return null;
  }

  return cached!.conn;
}
