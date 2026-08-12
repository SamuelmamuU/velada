import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Cita } from "@/models/Cita";

export const DEFAULT_USERS = [
  {
    nombre: "Novio",
    email: "novio@velada.app",
    password: process.env.DEFAULT_NOVIO_PASSWORD || "NovioVelada2026!",
    rol: "novio" as const,
  },
  {
    nombre: "Novia",
    email: "novia@velada.app",
    password: process.env.DEFAULT_NOVIA_PASSWORD || "NoviaVelada2026!",
    rol: "novia" as const,
  },
];

export async function seedDatabase() {
  await connectDB();

  // 1. Inicializar usuarios si no existen
  const usuariosCreados = [];
  for (const u of DEFAULT_USERS) {
    let user = await Usuario.findOne({ email: u.email.toLowerCase() });
    if (!user) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      user = await Usuario.create({
        nombre: u.nombre,
        email: u.email.toLowerCase(),
        passwordHash,
        rol: u.rol,
      });
      console.log(`[Seed] Usuario creado: ${u.email} (${u.rol})`);
    }
    usuariosCreados.push(user);
  }

  const novioUser = usuariosCreados.find((u) => u.rol === "novio");

  // 2. Inicializar citas de demostración si la colección está vacía
  const citasCount = await Cita.countDocuments();
  if (citasCount === 0 && novioUser) {
    const citasIniciales = [
      {
        nombre: "Cena bajo las luces",
        descripcion:
          "Una mesa reservada para nosotros, vino tinto y la terraza que tanto te gusta. Llegamos temprano para alcanzar el atardecer.",
        horario: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // En 4 días
        lugar: {
          direccion: "Terraza San Pedro, Av. Real, San Pedro Garza García",
          lat: 25.6572,
          lng: -100.4024,
        },
        tematica: "Romántico",
        vestimentaRecomendada:
          "Elegante casual — algo cómodo que te haga sentir bonita, la terraza tiene piso de piedra.",
        estado: "confirmada" as const,
        creadoPor: novioUser._id,
      },
      {
        nombre: "Tarde de museo y café",
        descripcion:
          "Recorrido por la exposición nueva y café después en el patio central, sin ninguna prisa.",
        horario: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // En 12 días
        lugar: {
          direccion: "Museo MARCO, Zuazua y Padre Raymundo Jardón, Centro",
          lat: 25.6665,
          lng: -100.3096,
        },
        tematica: "Cultural",
        vestimentaRecomendada: "Casual relajado y zapatos cómodos para caminar.",
        estado: "pendiente" as const,
        creadoPor: novioUser._id,
      },
      {
        nombre: "Ruta de tacos y noche de estrellas",
        descripcion:
          "Empezamos probando tacos en el Barrio Antiguo y terminamos viendo estrellas con mantas en la Huasteca.",
        horario: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // En 18 días
        lugar: {
          direccion: "Parque La Huasteca, Santa Catarina, N.L.",
          lat: 25.6219,
          lng: -100.4578,
        },
        tematica: "Aventura",
        vestimentaRecomendada:
          "Ropa abrigadora ligera para la noche y calzado para exterior.",
        estado: "confirmada" as const,
        creadoPor: novioUser._id,
      },
    ];

    await Cita.insertMany(citasIniciales);
    console.log(`[Seed] ${citasIniciales.length} citas iniciales creadas.`);
  }

  return {
    usuarios: usuariosCreados.map((u) => ({
      id: u._id.toString(),
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
    })),
  };
}
