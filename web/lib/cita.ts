import { site } from "./site";

export type Cita = {
  nombre: string;
  telefono: string;
  email: string | null;
  municipio: string;
  direccion: string;
  vehiculo: string;
  servicio: string;
  fecha: string;
  hora: string;
  notas: string | null;
};

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Valida los datos del formulario. Devuelve la cita limpia o un mensaje de error.
export function validarCita(input: Record<string, unknown>): { cita: Cita } | { error: string } {
  const c = {
    nombre: str(input.nombre, 100),
    telefono: str(input.telefono, 30),
    email: str(input.email, 150) || null,
    municipio: str(input.municipio, 50),
    direccion: str(input.direccion, 250),
    vehiculo: str(input.vehiculo, 50),
    servicio: str(input.servicio, 30),
    fecha: str(input.fecha, 10),
    hora: str(input.hora, 40),
    notas: str(input.notas, 1000) || null,
  };

  if (c.nombre.length < 2) return { error: "Escribe tu nombre." };
  if (c.telefono.replace(/\D/g, "").length < 10) return { error: "Escribe un teléfono válido de 10 dígitos." };
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return { error: "El email no es válido." };
  if (!(site.municipios as readonly string[]).includes(c.municipio)) return { error: "Elige tu municipio." };
  if (c.direccion.length < 5) return { error: "Escribe la dirección donde está el carro." };
  if (!(site.vehiculos as readonly string[]).includes(c.vehiculo)) return { error: "Elige el tipo de vehículo." };
  if (!site.servicios.some((s) => s.id === c.servicio)) return { error: "Elige un servicio." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) return { error: "Elige una fecha." };
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  if (c.fecha < hoy) return { error: "La fecha no puede ser en el pasado." };
  if (!(site.horas as readonly string[]).includes(c.hora)) return { error: "Elige una hora." };

  return { cita: c };
}
