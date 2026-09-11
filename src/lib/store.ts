import { ICitaResponse, IUsuarioResponse, IPareja } from "@/types";

// Base de datos en memoria para fallback cuando MongoDB no está en ejecución localmente
interface MemoryDatabase {
  usuarios: (IUsuarioResponse & { passwordHash: string })[];
  parejas: IPareja[];
  citas: ICitaResponse[];
}

const globalStore = global as unknown as { __velada_mem_db?: MemoryDatabase };

if (!globalStore.__velada_mem_db) {
  globalStore.__velada_mem_db = {
    usuarios: [
      {
        id: "64f1a2b3c4d5e6f7a8b9c001",
        nombre: "Samuel",
        email: "novio@velada.app",
        rol: "novio",
        parejaId: "pareja_default_samuel_diana",
        codigoVinculacion: "AVENTURA-S4M9X2",
        estadoPareja: "conectados",
        nombrePareja: "Diana",
        passwordHash: "$2a$10$7rO0y4.t03rC70wA0e0Hqu8p9KqY6z0cR0Y0e0Hqu8p9KqY6z0cRe", // NovioVelada2026!
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c002",
        nombre: "Diana",
        email: "novia@velada.app",
        rol: "novia",
        parejaId: "pareja_default_samuel_diana",
        codigoVinculacion: "AVENTURA-D7N8T5",
        estadoPareja: "conectados",
        nombrePareja: "Samuel",
        passwordHash: "$2a$10$7rO0y4.t03rC70wA0e0Hqu8p9KqY6z0cR0Y0e0Hqu8p9KqY6z0cRe", // NoviaVelada2026!
      },
    ],
    parejas: [
      {
        id: "pareja_default_samuel_diana",
        codigoVinculacion: "AVENTURA-S4M9X2",
        novioId: "64f1a2b3c4d5e6f7a8b9c001",
        noviaId: "64f1a2b3c4d5e6f7a8b9c002",
        estado: "conectados",
        fechaVinculacion: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
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
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "especial",
        ambiente: "exterior",
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
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
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "media",
        ambiente: "interior",
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
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
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 4,
          tipoAcompanantes: "mayoria_conocidos",
          hayFamilia: false,
        },
        importancia: "alta",
        ambiente: "exterior",
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c104",
        nombre: "Pícnic sorpresa y atardecer",
        descripcion:
          "Una canastita con tus postres favoritos, frutas frescas y una mantita en el pasto para ver caer el sol abrazados.",
        horario: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Parque Fundidora, Jardines Orientales, Monterrey, N.L.",
          lat: 25.6787,
          lng: -100.2842,
        },
        tematica: "Romántico",
        vestimentaRecomendada:
          "Vestido fresco o ropa cómoda de verano que te permita sentarte en el césped.",
        estado: "pendiente",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "especial",
        ambiente: "exterior",
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c105",
        nombre: "Nuestra escapada a las cabañas",
        descripcion:
          "Fin de semana en el bosque, fogata bajo la noche despejada y el café de la mañana mirando la montaña.",
        horario: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Cabañas del Bosque, Santiago, N.L.",
          lat: 25.4241,
          lng: -100.1508,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Ropa abrigadora cómoda para el bosque.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "especial",
        ambiente: "exterior",
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/CABANA.jpg",
          pieDeFoto: "Nuestra cabaña mágica en la montaña",
          fechaSubida: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c106",
        nombre: "Paseo en bote por Santa Lucía",
        descripcion:
          "Recorrido nocturno por el canal, luces reflejadas en el agua y cena deliciosa al terminar el trayecto.",
        horario: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Paseo Santa Lucía, Centro, Monterrey, N.L.",
          lat: 25.6714,
          lng: -100.3012,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Casual elegante para paseo junto al canal.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "alta",
        ambiente: "exterior",
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/SANTALUCIA.jpg",
          pieDeFoto: "Navegando bajo las luces de la noche",
          fechaSubida: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c107",
        nombre: "Cena de nuestro aniversario",
        descripcion:
          "Nuestra velada más especial del año, recordando cada aventura vivida y brindando por todas las que vienen.",
        horario: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Restaurante La Casona, San Pedro Garza García, N.L.",
          lat: 25.6565,
          lng: -100.4011,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Elegante formal para noche de aniversario.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "especial",
        ambiente: "interior",
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/ANIVERSARIO.jpg",
          pieDeFoto: "Celebrando nuestro aniversario con vino y sonrisas",
          fechaSubida: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c108",
        nombre: "Tarde de juegos y arcade retro",
        descripcion:
          "Torneo de maquinitas, risas sin parar y una nieve al final de la tarde.",
        horario: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Arcade Vintage Club, Barrio Antiguo, Monterrey",
          lat: 25.6669,
          lng: -100.3065,
        },
        tematica: "Diversión",
        vestimentaRecomendada: "Jeans cómodos y tenis para jugar.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "media",
        ambiente: "interior",
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/ARCADE.jpg",
          pieDeFoto: "Tarde de maquinitas retro donde me ganaste en todo",
          fechaSubida: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c109",
        nombre: "Celebración de graduación",
        descripcion:
          "Festejando una meta enorme juntos, flores, abrazos y el orgullo más grande en el pecho.",
        horario: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Jardines del Museo MARCO, Centro, Monterrey",
          lat: 25.6665,
          lng: -100.3096,
        },
        tematica: "Especial",
        vestimentaRecomendada: "Formal elegante de graduación.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: true,
        },
        importancia: "especial",
        ambiente: "mixto",
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/GRADUACION.jpg",
          pieDeFoto: "Orgulloso de cada uno de tus pasos y metas cumplidas",
          fechaSubida: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c110",
        nombre: "Día de voluntariado juntos",
        descripcion:
          "Una mañana sembrando arbolitos en la montaña, llenándonos de tierra y compartiendo un pícnic fresco.",
        horario: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Parque Ecológico Chipinque, San Pedro Garza García",
          lat: 25.6171,
          lng: -100.3592,
        },
        tematica: "Aventura",
        vestimentaRecomendada: "Ropa deportiva cómoda y botas de senderismo.",
        estado: "aceptada",
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja",
          hayFamilia: false,
        },
        importancia: "media",
        ambiente: "exterior",
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/VOLUNTARIOS.jpg",
          pieDeFoto: "Sembrando recuerdos y cuidando el bosque de tu mano",
          fechaSubida: new Date(Date.now() - 73 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}

if (globalStore.__velada_mem_db) {
  if (!Array.isArray(globalStore.__velada_mem_db.parejas)) {
    globalStore.__velada_mem_db.parejas = [
      {
        id: "pareja_default_samuel_diana",
        codigoVinculacion: "AVENTURA-S4M9X2",
        novioId: "64f1a2b3c4d5e6f7a8b9c001",
        noviaId: "64f1a2b3c4d5e6f7a8b9c002",
        estado: "conectados",
        fechaVinculacion: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
  } else {
    // Si quedó "AVENTURA-LOVE" por hot reload, actualizar a códigos individuales
    const sam = globalStore.__velada_mem_db.usuarios?.find((u) => u.email === "novio@velada.app");
    if (sam && (!sam.codigoVinculacion || sam.codigoVinculacion === "AVENTURA-LOVE")) {
      sam.codigoVinculacion = "AVENTURA-S4M9X2";
    }
    const dia = globalStore.__velada_mem_db.usuarios?.find((u) => u.email === "novia@velada.app");
    if (dia && (!dia.codigoVinculacion || dia.codigoVinculacion === "AVENTURA-LOVE")) {
      dia.codigoVinculacion = "AVENTURA-D7N8T5";
    }
    const par = globalStore.__velada_mem_db.parejas?.find((p) => p.id === "pareja_default_samuel_diana");
    if (par && (!par.codigoVinculacion || par.codigoVinculacion === "AVENTURA-LOVE")) {
      par.codigoVinculacion = "AVENTURA-S4M9X2";
    }

    // Sincronizar recuerdos fotográficos en citas si faltan por hot reload
    const c106 = globalStore.__velada_mem_db.citas?.find((c) => c.id === "64f1a2b3c4d5e6f7a8b9c106");
    if (c106 && !c106.recuerdo?.fotoUrl) {
      c106.recuerdo = {
        fotoUrl: "/polaroids/SANTALUCIA.jpg",
        pieDeFoto: "Navegando bajo las luces de la noche",
        fechaSubida: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    const existingIds = new Set(globalStore.__velada_mem_db.citas?.map((c) => c.id) || []);
    const polaroidCitasToAdd = [
      {
        id: "64f1a2b3c4d5e6f7a8b9c107",
        nombre: "Cena de nuestro aniversario",
        descripcion:
          "Nuestra velada más especial del año, recordando cada aventura vivida y brindando por todas las que vienen.",
        horario: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Restaurante La Casona, San Pedro Garza García, N.L.",
          lat: 25.6565,
          lng: -100.4011,
        },
        tematica: "Romántico",
        vestimentaRecomendada: "Elegante formal para noche de aniversario.",
        estado: "aceptada" as const,
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja" as const,
          hayFamilia: false,
        },
        importancia: "especial" as const,
        ambiente: "interior" as const,
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/ANIVERSARIO.jpg",
          pieDeFoto: "Celebrando nuestro aniversario con vino y sonrisas",
          fechaSubida: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c108",
        nombre: "Tarde de juegos y arcade retro",
        descripcion:
          "Torneo de maquinitas, risas sin parar y una nieve al final de la tarde.",
        horario: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Arcade Vintage Club, Barrio Antiguo, Monterrey",
          lat: 25.6669,
          lng: -100.3065,
        },
        tematica: "Diversión",
        vestimentaRecomendada: "Jeans cómodos y tenis para jugar.",
        estado: "aceptada" as const,
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja" as const,
          hayFamilia: false,
        },
        importancia: "media" as const,
        ambiente: "interior" as const,
        esFlexible: true,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/ARCADE.jpg",
          pieDeFoto: "Tarde de maquinitas retro donde me ganaste en todo",
          fechaSubida: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c109",
        nombre: "Celebración de graduación",
        descripcion:
          "Festejando una meta enorme juntos, flores, abrazos y el orgullo más grande en el pecho.",
        horario: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Jardines del Museo MARCO, Centro, Monterrey",
          lat: 25.6665,
          lng: -100.3096,
        },
        tematica: "Especial",
        vestimentaRecomendada: "Formal elegante de graduación.",
        estado: "aceptada" as const,
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja" as const,
          hayFamilia: true,
        },
        importancia: "especial" as const,
        ambiente: "mixto" as const,
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/GRADUACION.jpg",
          pieDeFoto: "Orgulloso de cada uno de tus pasos y metas cumplidas",
          fechaSubida: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "64f1a2b3c4d5e6f7a8b9c110",
        nombre: "Día de voluntariado juntos",
        descripcion:
          "Una mañana sembrando arbolitos en la montaña, llenándonos de tierra y compartiendo un pícnic fresco.",
        horario: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        lugar: {
          direccion: "Parque Ecológico Chipinque, San Pedro Garza García",
          lat: 25.6171,
          lng: -100.3592,
        },
        tematica: "Aventura",
        vestimentaRecomendada: "Ropa deportiva cómoda y botas de senderismo.",
        estado: "aceptada" as const,
        asistencia: {
          cantidadPersonas: 2,
          tipoAcompanantes: "solo_pareja" as const,
          hayFamilia: false,
        },
        importancia: "media" as const,
        ambiente: "exterior" as const,
        esFlexible: false,
        parejaId: "pareja_default_samuel_diana",
        recuerdo: {
          fotoUrl: "/polaroids/VOLUNTARIOS.jpg",
          pieDeFoto: "Sembrando recuerdos y cuidando el bosque de tu mano",
          fechaSubida: new Date(Date.now() - 73 * 24 * 60 * 60 * 1000).toISOString(),
        },
        creadoPor: {
          id: "64f1a2b3c4d5e6f7a8b9c001",
          nombre: "Novio",
        },
        createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    if (Array.isArray(globalStore.__velada_mem_db.citas)) {
      for (const pCita of polaroidCitasToAdd) {
        if (!existingIds.has(pCita.id)) {
          globalStore.__velada_mem_db.citas.push(pCita);
        }
      }
    }
  }
}

export const memoryStore = globalStore.__velada_mem_db!;

