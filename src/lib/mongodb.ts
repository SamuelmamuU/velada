import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // En desarrollo sin .env configurado, advertencia controlada
  console.warn(
    "⚠️ [MongoDB] Advertencia: MONGODB_URI no está definido en variables de entorno."
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Por favor define la variable de entorno MONGODB_URI en tu archivo .env.local"
    );
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        return m;
      })
      .catch((err) => {
        cached!.promise = null;
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}
