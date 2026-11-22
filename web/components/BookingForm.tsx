"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

type Estado = { tipo: "idle" } | { tipo: "enviando" } | { tipo: "ok" } | { tipo: "error"; mensaje: string } | { tipo: "sin_config" };

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-sky-100";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

export function BookingForm() {
  const [estado, setEstado] = useState<Estado>({ tipo: "idle" });
  // Se calcula en el navegador (no al compilar) para que "hoy" sea el día real de la visita.
  const [hoy, setHoy] = useState<string>();
  useEffect(() => {
    setHoy(new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado({ tipo: "enviando" });
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setEstado({ tipo: "ok" });
        return;
      }
      if (json.error === "no_configurado") {
        setEstado({ tipo: "sin_config" });
        return;
      }
      setEstado({ tipo: "error", mensaje: json.error ?? "Algo salió mal. Intenta de nuevo." });
    } catch {
      setEstado({ tipo: "error", mensaje: "No hay conexión. Intenta de nuevo o escríbenos por WhatsApp." });
    }
  }

  if (estado.tipo === "ok") {
    return (
      <div role="status" className="rounded-3xl border border-sky-100 bg-sky-50 p-8 text-center">
        <p className="text-4xl">✓</p>
        <h3 className="mt-3 text-2xl font-semibold">¡Recibimos tu cita!</h3>
        <p className="mt-2 text-slate-600">
          Te escribimos por WhatsApp al número que nos diste para confirmar la hora.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      {/* Campo trampa anti-spam (oculto) */}
      <input type="text" name="empresa" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <label htmlFor="nombre" className={label}>Nombre *</label>
        <input id="nombre" name="nombre" required minLength={2} autoComplete="name" className={input} placeholder="Tu nombre" />
      </div>
      <div>
        <label htmlFor="telefono" className={label}>Teléfono / WhatsApp *</label>
        <input id="telefono" name="telefono" type="tel" required autoComplete="tel" className={input} placeholder="787-000-0000" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="email" className={label}>Email <span className="font-normal text-slate-400">(opcional)</span></label>
        <input id="email" name="email" type="email" autoComplete="email" className={input} placeholder="tu@email.com" />
      </div>
      <div>
        <label htmlFor="municipio" className={label}>Municipio *</label>
        <select id="municipio" name="municipio" required defaultValue="" className={input}>
          <option value="" disabled>Elige…</option>
          {site.municipios.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="vehiculo" className={label}>Tipo de vehículo *</label>
        <select id="vehiculo" name="vehiculo" required defaultValue="" className={input}>
          <option value="" disabled>Elige…</option>
          {site.vehiculos.map((v) => <option key={v}>{v}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="direccion" className={label}>Dirección donde está el carro *</label>
        <input id="direccion" name="direccion" required minLength={5} autoComplete="street-address" className={input} placeholder="Calle, número, urbanización" />
      </div>
      <fieldset className="sm:col-span-2">
        <legend className={label}>Servicio *</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {site.servicios.map((s) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition has-[:checked]:border-accent has-[:checked]:bg-sky-50">
              <input type="radio" name="servicio" value={s.id} required defaultChecked={"destacado" in s} className="accent-sky-500" />
              <span className="font-medium">{s.nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="fecha" className={label}>Fecha *</label>
        <input id="fecha" name="fecha" type="date" required min={hoy} className={input} />
      </div>
      <div>
        <label htmlFor="hora" className={label}>Hora preferida *</label>
        <select id="hora" name="hora" required defaultValue="" className={input}>
          <option value="" disabled>Elige…</option>
          {site.horas.map((h) => <option key={h}>{h}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="notas" className={label}>Notas <span className="font-normal text-slate-400">(opcional)</span></label>
        <textarea id="notas" name="notas" rows={3} className={input} placeholder="Ej: estacionado en la marquesina, mascota en casa, pelo de perro en el interior…" />
      </div>

      {estado.tipo === "error" && (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{estado.mensaje}</p>
      )}
      {estado.tipo === "sin_config" && (
        <p role="alert" className="sm:col-span-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El formulario en línea aún no está activo. Agenda tu cita por{" "}
          <a href={site.whatsappHref} className="font-semibold underline">WhatsApp</a> o llama al{" "}
          <a href={site.phoneHref} className="font-semibold underline">{site.phoneDisplay}</a>.
        </p>
      )}

      <button
        type="submit"
        disabled={estado.tipo === "enviando"}
        className="sm:col-span-2 rounded-full bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
      >
        {estado.tipo === "enviando" ? "Enviando…" : "Agendar mi cita"}
      </button>
      <p className="sm:col-span-2 -mt-2 text-center text-xs text-slate-500">
        Te confirmamos por WhatsApp. Sin pago por adelantado.
      </p>
    </form>
  );
}
