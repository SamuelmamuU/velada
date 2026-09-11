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
      const userCode = u.rol === "novio" ? "AVENTURA-S4M9X2" : "AVENTURA-D7N8T5";
      user = await Usuario.create({
        nombre: u.nombre,
        email: u.email.toLowerCase(),
        passwordHash,
        rol: u.rol,
        codigoVinculacion: userCode,
      });
      console.log(`[Seed] Usuario creado: ${u.email} (${u.rol}) con código ${userCode}`);
    }
    usuariosCreados.push(user);
  }

  const novioUser = usuariosCreados.find((u) => u.rol === "novio");
  const noviaUser = usuariosCreados.find((u) => u.rol === "novia");

  // Crear o vincular Pareja por defecto para Samuel y Diana
  let defaultPareja = await Pareja.findOne({
    $or: [{ codigoVinculacion: "AVENTURA-S4M9X2" }, { codigoVinculacion: "AVENTURA-LOVE" }],
  });
  if (!defaultPareja && novioUser && noviaUser) {
    defaultPareja = await Pareja.create({
      codigoVinculacion: "AVENTURA-S4M9X2",
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
        recuerdo: {
          fotoUrl: "/polaroids/SANTALUCIA.jpg",
          pieDeFoto: "Navegando bajo las luces de la noche",
          fechaSubida: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
    }

    const aniversarioExist = await Cita.findOne({ nombre: "Cena de nuestro aniversario" });
    if (!aniversarioExist) {
      await Cita.create({
        nombre: "Cena de nuestro aniversario",
        descripcion: "Nuestra velada más especial del año, recordando cada aventura vivida.",
        horario: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Restaurante La Casona, San Pedro Garza García, N.L.",
          lat: 25.6565,
          lng: -100.4011,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Elegante formal para noche de aniversario.",
        estado: "confirmada",
        importancia: "especial",
        ambiente: "interior",
        recuerdo: {
          fotoUrl: "/polaroids/ANIVERSARIO.jpg",
          pieDeFoto: "Celebrando nuestro aniversario con vino y sonrisas",
          fechaSubida: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
    }

    const arcadeExist = await Cita.findOne({ nombre: "Tarde de juegos y arcade retro" });
    if (!arcadeExist) {
      await Cita.create({
        nombre: "Tarde de juegos y arcade retro",
        descripcion: "Torneo de maquinitas, risas sin parar y una nieve al final de la tarde.",
        horario: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Arcade Vintage Club, Barrio Antiguo, Monterrey",
          lat: 25.6669,
          lng: -100.3065,
        },
        tematica: "Diversión",
        vestimentaRecomendada: "Jeans cómodos y tenis para jugar.",
        estado: "confirmada",
        importancia: "media",
        ambiente: "interior",
        recuerdo: {
          fotoUrl: "/polaroids/ARCADE.jpg",
          pieDeFoto: "Tarde de maquinitas retro donde me ganaste en todo",
          fechaSubida: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
    }

    const graduacionExist = await Cita.findOne({ nombre: "Celebración de graduación" });
    if (!graduacionExist) {
      await Cita.create({
        nombre: "Celebración de graduación",
        descripcion: "Festejando una meta enorme juntos, flores y orgullo inmenso.",
        horario: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Jardines del Museo MARCO, Centro, Monterrey",
          lat: 25.6665,
          lng: -100.3096,
        },
        tematica: "Especial",
        vestimentaRecomendada: "Formal elegante de graduación.",
        estado: "confirmada",
        importancia: "especial",
        ambiente: "mixto",
        recuerdo: {
          fotoUrl: "/polaroids/GRADUACION.jpg",
          pieDeFoto: "Orgulloso de cada uno de tus pasos y metas cumplidas",
          fechaSubida: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
    }

    const voluntariosExist = await Cita.findOne({ nombre: "Día de voluntariado juntos" });
    if (!voluntariosExist) {
      await Cita.create({
        nombre: "Día de voluntariado juntos",
        descripcion: "Una mañana sembrando arbolitos en la montaña y compartiendo un pícnic.",
        horario: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        lugar: {
          direccion: "Parque Ecológico Chipinque, San Pedro Garza García",
          lat: 25.6171,
          lng: -100.3592,
        },
        tematica: "Aventura",
        vestimentaRecomendada: "Ropa deportiva cómoda y botas de senderismo.",
        estado: "confirmada",
        importancia: "media",
        ambiente: "exterior",
        recuerdo: {
          fotoUrl: "/polaroids/VOLUNTARIOS.jpg",
          pieDeFoto: "Sembrando recuerdos y cuidando el bosque de tu mano",
          fechaSubida: new Date(Date.now() - 73 * 24 * 60 * 60 * 1000),
        },
        creadoPor: novioUser._id,
        parejaId: defaultPareja?._id,
      });
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
