# Deployment

## Recomendacion actual

Para este proyecto y este volumen inicial de usuarios, la combinacion mas pragmatica es:

- `apps/web` en Vercel Hobby
- `apps/api` en Render Free
- PostgreSQL en Neon

Motivo:

- Vercel Hobby sigue siendo gratis para proyectos personales y chicos.
- Render Free permite web services Node gratis, aunque con spin down por inactividad.
- Neon ya esta integrado en este proyecto y evita sumar otra base.

Tradeoff importante:

- el API en Render Free puede dormirse tras 15 minutos sin trafico
- la primera request despues de eso puede tardar hasta cerca de un minuto
- para 2 o 3 usuarios iniciales sigue siendo una base valida, pero no es experiencia premium

## Deploy web en Vercel

1. Crear proyecto nuevo en Vercel conectando este repo.
2. En el proyecto seleccionar `apps/web` como Root Directory.
3. Configurar variable:
   - `NEXT_PUBLIC_API_URL=https://TU-API.onrender.com/api`
4. Deploy.

## Deploy API en Render

Podés usar el archivo [render.yaml](/c:/Users/fran_/Desktop/dev/Pucho/render.yaml) o crear el servicio manualmente.

Variables requeridas:

- `DATABASE_URL`
- `CORS_ORIGIN=https://TU-WEB.vercel.app`
- `API_PREFIX=api`

Build command:

```bash
corepack enable && pnpm install --frozen-lockfile && pnpm --filter api build
```

Start command:

```bash
pnpm --filter api start:prod
```

Health check:

```text
/api/health
```

## Orden recomendado

1. Deployar API en Render.
2. Tomar la URL publica del API.
3. Deployar Web en Vercel apuntando a esa URL.
4. Actualizar `CORS_ORIGIN` del API con la URL final de Vercel.
5. Volver a desplegar el API si hace falta.

## PWA

La app ya expone manifest y navega bien en mobile.
Una vez deployada:

1. Abrila desde Chrome en Android o Safari en iPhone.
2. Elegí `Agregar a pantalla de inicio`.
3. El acceso directo abre en modo app y no como pestaña normal.
