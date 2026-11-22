# Landing: Lavado de carros a domicilio (PR)

La especificación completa está en [`SPEC.md`](./SPEC.md). El nombre, el contacto, los municipios y los servicios se cambian en `lib/site.ts`.

## Desarrollo
```bash
npm install
cp .env.example .env.local   # pon tus claves de Supabase
npm run dev                  # http://localhost:3000
```

## Supabase (base de datos de citas)
1. Crea un proyecto en supabase.com.
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
3. En **Project Settings → API**, copia la *Project URL* y la clave *anon public* y ponlas en `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
4. Las citas llegan a **Table Editor → citas**.

Si no hay variables configuradas, el formulario sigue funcionando: le pide al cliente que agende por WhatsApp o por teléfono.

## Vercel (publicar)
1. En vercel.com → **Add New → Project**, importa el repo `ian202010/ian`.
2. **Root Directory:** `web`.
3. En **Environment Variables**, añade `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
4. Deploy.
