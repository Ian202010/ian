import { BookingForm } from "@/components/BookingForm";
import { site } from "@/lib/site";

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
    <path d={d} />
  </svg>
);

const iconos: Record<string, string> = {
  exterior: "M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z",
  interior: "M5 11V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M4 11h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6zM7 19v2M17 19v2",
  completo: "M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z",
};

const pasos = [
  { t: "Llenas el formulario", d: "Escoges el servicio, la fecha y dónde está tu carro. Toma 1 minuto." },
  { t: "Te confirmamos", d: "Te escribimos por WhatsApp para confirmar la hora y el precio según tu vehículo." },
  { t: "Llegamos y lavamos", d: "Vamos a tu casa u oficina. Tú sigues con tu día y tu carro queda brillando." },
];

const faqs = [
  { q: "¿Tengo que darles agua o electricidad?", a: "Llevamos nuestro equipo. Si tienes una toma de agua cerca nos ayuda, pero no es obligatorio. Te lo confirmamos al agendar." },
  { q: "¿Cuánto tarda el servicio?", a: "Depende del tamaño y estado del vehículo. Un lavado completo toma normalmente entre 1 y 2 horas." },
  { q: "¿Cuánto cuesta?", a: "El precio depende del tipo de vehículo y del servicio. Te damos el precio exacto por WhatsApp antes de confirmar, sin compromiso." },
  { q: "¿Cómo pago?", a: "Pagas al terminar, cuando ya viste el resultado. Te indicamos los métodos de pago al confirmar la cita." },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-white">
              <Icon d={iconos.exterior} />
            </span>
            <span className="hidden sm:inline">{site.name}</span>
            <span className="sm:hidden">{site.shortName}</span>
          </a>
          <a href="#agendar" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
            Agendar cita
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-medium text-accent-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Área metro de Puerto Rico
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Tu carro limpio, <span className="text-accent">sin salir de casa.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600 sm:text-xl">
            Lavado a domicilio por dentro y por fuera. Llegamos a tu casa u oficina en {site.municipios.slice(0, 4).join(", ")} y más.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#agendar" className="rounded-full bg-slate-900 px-8 py-4 text-center text-base font-semibold text-white transition hover:bg-slate-700">
              Agendar mi cita
            </a>
            <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-slate-200 px-8 py-4 text-center text-base font-semibold transition hover:border-slate-400">
              Escribir por WhatsApp
            </a>
          </div>
        </section>

        {/* Servicios */}
        <section id="servicios" className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Servicios</h2>
            <p className="mt-3 text-slate-600">Precio según el tamaño del vehículo. Te lo confirmamos antes de la cita.</p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {site.servicios.map((s) => {
                const destacado = "destacado" in s;
                return (
                  <article key={s.id} className={`relative rounded-3xl bg-white p-8 ${destacado ? "ring-2 ring-accent" : "ring-1 ring-slate-200"}`}>
                    {destacado && (
                      <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">Más pedido</span>
                    )}
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-accent-dark">
                      <Icon d={iconos[s.id]} />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold">{s.nombre}</h3>
                    <p className="mt-2 text-slate-600">{s.descripcion}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Cómo funciona</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {pasos.map((p, i) => (
              <li key={p.t}>
                <span className="text-sm font-semibold text-accent">0{i + 1}</span>
                <h3 className="mt-2 text-xl font-semibold">{p.t}</h3>
                <p className="mt-2 text-slate-600">{p.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Zona */}
        <section className="border-y border-slate-100 py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Dónde damos servicio</h2>
            <ul className="flex flex-wrap gap-2">
              {site.municipios.map((m) => (
                <li key={m} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">{m}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Formulario */}
        <section id="agendar" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Agenda tu cita</h2>
          <p className="mt-3 mb-10 text-slate-600">Llena el formulario y te confirmamos por WhatsApp.</p>
          <BookingForm />
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Preguntas frecuentes</h2>
            <div className="mt-10 divide-y divide-slate-200">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium">
                    {f.q}
                    <span className="ml-4 text-2xl text-slate-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-slate-900">{site.name}</p>
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <a href={site.phoneHref} className="hover:text-slate-900">{site.phoneDisplay}</a>
            <a href={`mailto:${site.email}`} className="hover:text-slate-900">{site.email}</a>
            <span>Área metro, Puerto Rico</span>
          </div>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={site.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zM12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6C8 23.4 10 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z" />
        </svg>
      </a>
    </>
  );
}
