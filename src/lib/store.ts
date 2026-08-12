import { ICitaResponse, IUsuarioResponse } from "@/types";

// Base de datos en memoria para fallback cuando MongoDB no está en ejecución localmente
interface MemoryDatabase {
  usuarios: (IUsuarioResponse & { passwordHash: string })[];
  citas: ICitaResponse[];
}

const globalStore = global as unknown as { __velada_mem_db?: MemoryDatabase };

if (!globalStore.__velada_mem_db) {
  globalStore.__velada_mem_db = {
    usuarios: [
      {
        id: "64f1a2b3c4d5e6f7a8b9c001",
        nombre: "Novio",
        email: "novio@velada.app",
        rol: "novio",
        passwordHash: "$2a$10$7rO0y4.t03rC70wA0e0Hqu8p9KqY6z0cR0Y0e0Hqu8p9KqY6z0cRe", // NovioVelada2026!
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c002",
        nombre: "Novia",
        email: "novia@velada.app",
        rol: "novia",
        passwordHash: "$2a$10$7rO0y4.t03rC70wA0e0Hqu8p9KqY6z0cR0Y0e0Hqu8p9KqY6z0cRe", // NoviaVelada2026!
      },
    ],
    citas: [
      {
        id: "64f1a2b3c4d5e6f7a8b9c101",
        nombre: "Cena bajo las luces",
        descripcion:
          "Una mesa reservada para nosotros, vino tinto y la terraza que tanto te gusta. Llegamos temprano para alcanzar el atardecer.",
        horario: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Terraza San Pedro, Av. Real, San Pedro Garza García",
          lat: 25.6572,
          lng: -100.4024,
        },
        tematica: "Romántico",
        vestimentaRecomendada:
          "Elegante casual — algo cómodo que te haga sentir bonita, la terraza tiene piso de piedra.",
        estado: "confirmada",
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c102",
        nombre: "Tarde de museo y café",
        descripcion:
          "Recorrido por la exposición nueva y café después en el patio central, sin ninguna prisa.",
        horario: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Museo MARCO, Zuazua y Padre Raymundo Jardón, Centro",
          lat: 25.6665,
          lng: -100.3096,
        },
        tematica: "Cultural",
        vestimentaRecomendada: "Casual relajado y zapatos cómodos para caminar.",
        estado: "pendiente",
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c103",
        nombre: "Ruta de tacos y noche de estrellas",
        descripcion:
          "Empezamos probando tacos en el Barrio Antiguo y terminamos viendo estrellas con mantas en la Huasteca.",
        horario: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Parque La Huasteca, Santa Catarina, N.L.",
          lat: 25.6219,
          lng: -100.4578,
        },
        tematica: "Aventura",
        vestimentaRecomendada:
          "Ropa abrigadora ligera para la noche y calzado para exterior.",
        estado: "confirmada",
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

export const memoryStore = globalStore.__velada_mem_db!;
