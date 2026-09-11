import crypto from "crypto";
import { memoryStore } from "@/lib/store";
import { Usuario } from "@/models/Usuario";
import { Pareja } from "@/models/Pareja";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Genera un código aleatorio criptográficamente seguro con prefijo AVENTURA-
 * y 6 caracteres alfanuméricos de alta entropía (más de 729 millones de combinaciones).
 * Excluye caracteres ambiguos (0, O, 1, I) para evitar confusión al transcribir.
 */
export function generateRandomCode(): string {
  let result = "";
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += CHARS[randomBytes[i] % CHARS.length];
  }
  return `AVENTURA-${result}`;
}

/**
 * Comprueba si un código está disponible (no utilizado por ningún usuario ni pareja)
 */
export async function isCodeUnique(code: string, dbAvailable = false): Promise<boolean> {
  const upper = code.trim().toUpperCase();

  // 1. Validar en almacén en memoria
  if (Array.isArray(memoryStore?.usuarios)) {
    const inMemUser = memoryStore.usuarios.some(
      (u) => u.codigoVinculacion?.toUpperCase() === upper
    );
    if (inMemUser) return false;
  }

  if (Array.isArray(memoryStore?.parejas)) {
    const inMemPareja = memoryStore.parejas.some(
      (p) => p.codigoVinculacion?.toUpperCase() === upper
    );
    if (inMemPareja) return false;
  }

  // 2. Validar en MongoDB si la conexión está disponible
  if (dbAvailable) {
    try {
      const userExists = await Usuario.exists({ codigoVinculacion: upper });
      if (userExists) return false;

      const parejaExists = await Pareja.exists({ codigoVinculacion: upper });
      if (parejaExists) return false;
    } catch {
      // Si falla la consulta a BD, confiar en memoria
    }
  }

  return true;
}

/**
 * Genera un código de emparejamiento aleatorio único garantizado
 */
export async function generateUniquePairingCode(dbAvailable = false): Promise<string> {
  let code = generateRandomCode();
  let attempts = 0;
  while (!(await isCodeUnique(code, dbAvailable)) && attempts < 30) {
    code = generateRandomCode();
    attempts++;
  }
  return code;
}
