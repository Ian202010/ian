# SPEC — Landing: Lavado de carros a domicilio (Puerto Rico, área metro)

## 1. Contexto
- **Negocio:** lavado de carros a domicilio. Vamos a donde está el cliente (casa u oficina).
- **Servicio:** limpieza por dentro y por fuera.
- **Zona:** área metropolitana de Puerto Rico: San Juan, Bayamón, Carolina, Guaynabo, Trujillo Alto, Cataño y Toa Baja.
- **Nombre provisional:** "Car Wash a Domicilio PR". Se cambia en un solo sitio (`lib/site.ts`).
- **Contacto:** 939-383-4998 (llamada y WhatsApp) · iancastellano46@gmail.com
- **Objetivo / acción principal:** que el visitante **llene el formulario para agendar su cita**.

## 2. Público
Personas ocupadas del área metro (profesionales, familias) que no tienen tiempo de llevar el carro al car wash. Usan sobre todo el **celular**.

## 3. Estilo (referencia: minimalista y limpio)
- Fondo blanco o gris muy claro, mucho espacio, tipografía grande (Inter).
- Un solo color de acento: azul agua (#0ea5e9), que transmite limpieza y agua.
- Sin fotos de stock: iconos simples en línea.
- Diseño pensado primero para el celular. Botón de WhatsApp siempre visible.
- Español de Puerto Rico, trato cercano ("tu carro", "nosotros vamos").

## 4. Secciones
1. **Barra superior:** nombre y botón "Agendar cita".
2. **Hero:** "Tu carro limpio, sin salir de casa." Subtítulo con la zona. Botones "Agendar cita" y "WhatsApp".
3. **Servicios:** Exterior · Interior · Completo (dentro y fuera, el más recomendado). Sin precios por ahora: "Precio según tamaño del vehículo".
4. **Cómo funciona:** 1) Llenas el formulario → 2) Te confirmamos por WhatsApp → 3) Llegamos y lavamos.
5. **Zona de servicio:** lista de municipios del área metro.
6. **Formulario de cita (#agendar):** nombre*, teléfono*, email, municipio*, dirección*, tipo de vehículo*, servicio*, fecha*, hora preferida*, notas.
7. **Preguntas frecuentes:** ¿Necesitan agua o electricidad? ¿Cuánto tarda? ¿Cómo pago?
8. **Footer:** teléfono, email y zona.

## 5. Técnica
- **Frontend:** Next.js (App Router) + Tailwind CSS, en `web/`.
- **Base de datos:** Supabase, tabla `citas` (`supabase/schema.sql`). Con RLS, el público solo puede **insertar**, no leer.
- **Formulario:** ruta `POST /api/citas` que valida los datos y los guarda en Supabase por su API REST.
  - Si Supabase aún no está configurado, el formulario le pide al cliente que escriba por WhatsApp. Nunca falla en silencio.
- **Variables de entorno:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **Hosting:** Vercel, con Root Directory = `web`.

## 6. Fuera de alcance (por ahora)
Pagos en línea, panel de administración, precios y fotos reales del trabajo.
