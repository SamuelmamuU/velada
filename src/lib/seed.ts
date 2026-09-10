import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Usuario } from "@/models/Usuario";
import { Cita } from "@/models/Cita";
import { Pareja } from "@/models/Pareja";

export const DEFAULT_USERS = [
  {
    nombre: "Samuel",
    email: "novio@velada.app",
    password: process.env.DEFAULT_NOVIO_PASSWORD || "NovioVelada2026!",
    rol: "novio" as const,
  },
  {
    nombre: "Diana",
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
        codigoVinculacion: "AVENTURA-LOVE",
      });
      console.log(`[Seed] Usuario creado: ${u.email} (${u.rol})`);
    }
    usuariosCreados.push(user);
  }

  const novioUser = usuariosCreados.find((u) => u.rol === "novio");
  const noviaUser = usuariosCreados.find((u) => u.rol === "novia");

  // Crear o vincular Pareja por defecto para Samuel y Diana
  let defaultPareja = await Pareja.findOne({ codigoVinculacion: "AVENTURA-LOVE" });
  if (!defaultPareja && novioUser && noviaUser) {
    defaultPareja = await Pareja.create({
      codigoVinculacion: "AVENTURA-LOVE",
      novioId: novioUser._id,
      noviaId: noviaUser._id,
      estado: "conectados",
      fechaVinculacion: new Date("2026-01-01"),
    });
  }

  if (defaultPareja) {
    if (novioUser && !novioUser.parejaId) {
      novioUser.parejaId = defaultPareja._id;
      await novioUser.save();
    }
    if (noviaUser && !noviaUser.parejaId) {
      noviaUser.parejaId = defaultPareja._id;
      await noviaUser.save();
    }
  }


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
        parejaId: defaultPareja?._id,
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
        parejaId: defaultPareja?._id,
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
        parejaId: defaultPareja?._id,
      },
    ];

    await Cita.insertMany(citasIniciales);
    console.log(`[Seed] ${citasIniciales.length} citas iniciales creadas.`);
  }

  // 3. Asegurar que existan citas pasadas para probar Recuerdos
  if (novioUser) {
    const cabanaExist = await Cita.findOne({ nombre: "Escapada romántica a la cabaña" });
    if (!cabanaExist) {
      await Cita.create({
        nombre: "Escapada romántica a la cabaña",
        descripcion: "Un fin de semana alejados del ruido de la ciudad, chimenea encendida y chocolate caliente.",
        horario: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Cabañas del Bosque, Santiago, N.L.",
          lat: 25.4267,
          lng: -100.1508,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Suéter abrigador y botas cómodas.",
        estado: "confirmada",
        importancia: "especial",
        ambiente: "mixto",
        recuerdo: {
          fotoUrl: "/polaroids/CABANA.jpg",
          pieDeFoto: "Nuestra tarde perfecta en la cabaña entre la niebla y el café caliente.",
          fechaSubida: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
      console.log("[Seed] Cita pasada con recuerdo creada.");
    }

    const santaLuciaExist = await Cita.findOne({ nombre: "Paseo por Santa Lucía" });
    if (!santaLuciaExist) {
      await Cita.create({
        nombre: "Paseo por Santa Lucía",
        descripcion: "Caminata al atardecer por el canal, viendo las luces reflejadas en el agua.",
        horario: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Paseo Santa Lucía, Monterrey, N.L.",
          lat: 25.6698,
          lng: -100.3015,
        },
        tematica: "Casual",
        vestimentaRecomendada: "Ropa fresca y tenis cómodos.",
        estado: "confirmada",
        importancia: "alta",
        ambiente: "exterior",
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
      console.log("[Seed] Cita pasada sin recuerdo creada.");
    }
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
