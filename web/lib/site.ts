// Datos del negocio. Cambia aquí el nombre, contacto o zona y se actualiza toda la web.
export const site = {
  name: "Car Wash a Domicilio PR",
  shortName: "Car Wash PR",
  tagline: "Tu carro limpio, sin salir de casa.",
  phoneDisplay: "939-383-4998",
  phoneHref: "tel:+19393834998",
  whatsappHref:
    "https://wa.me/19393834998?text=" +
    encodeURIComponent("¡Hola! Quiero agendar un lavado a domicilio."),
  email: "iancastellano46@gmail.com",
  municipios: [
    "San Juan",
    "Bayamón",
    "Carolina",
    "Guaynabo",
    "Trujillo Alto",
    "Cataño",
    "Toa Baja",
  ],
  servicios: [
    {
      id: "exterior",
      nombre: "Exterior",
      descripcion: "Lavado a mano, aros y gomas, secado sin marcas y cristales.",
    },
    {
      id: "interior",
      nombre: "Interior",
      descripcion: "Aspirado, tablero y consola, puertas, alfombras y cristales por dentro.",
    },
    {
      id: "completo",
      nombre: "Completo",
      descripcion: "Por dentro y por fuera. Todo lo de Exterior más todo lo de Interior.",
      destacado: true,
    },
  ],
  vehiculos: ["Sedán / compacto", "SUV / crossover", "Pickup", "Van / minivan"],
  horas: ["8:00 AM – 10:00 AM", "10:00 AM – 12:00 PM", "12:00 PM – 2:00 PM", "2:00 PM – 4:00 PM", "4:00 PM – 6:00 PM"],
} as const;
