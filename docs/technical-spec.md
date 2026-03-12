# Technical Spec

## Arquitectura

Se usa un monorepo simple con `pnpm workspaces` por claridad y bajo costo operativo.

- `apps/web`: cliente Next.js App Router
- `apps/api`: API REST con NestJS
- `packages/config`: presets compartidos de TypeScript
- `docs`: especificaciones y roadmap

## Decisiones tecnicas

- API separada desde el inicio para practicar backend con NestJS y desacoplar evolucion multiusuario futura.
- PostgreSQL en Neon para persistencia real con costo bajo.
- Prisma como ORM y definicion inicial de dominio.
- `pnpm` como gestor del workspace por velocidad y soporte monorepo simple.
- Next.js con App Router por ser la opcion actual y estable del stack elegido.

## Modelo de dominio inicial

Entidades propuestas:

- `Profile`: preferencias globales del usuario actual
- `DailyEntry`: registro diario de consumo y resultado del dia
- `MonthlyAllowance`: snapshot mensual de dias libres disponibles y consumidos
- `Achievement`: catalogo de medallas
- `UnlockedAchievement`: medallas obtenidas

## API inicial

Modulos MVP:

- `health`
- `profile`
- `daily-entries`
- `stats`
- `achievements`

Primera etapa:

- `GET /health`
- `GET /profile`
- `PATCH /profile`
- `GET /daily-entries`
- `POST /daily-entries`
- `PATCH /daily-entries/:date`
- `GET /stats/summary`
- `GET /achievements`

## Frontend inicial

Se organiza por capas simples:

- `src/app`: rutas y layouts
- `src/components`: componentes compartidos de UI
- `src/features`: modulos de producto por pantalla
- `src/lib`: clientes, helpers y config

## Variables de entorno

Raiz:

- `DATABASE_URL`

API:

- `PORT`
- `API_PREFIX`
- `CORS_ORIGIN`

Web:

- `NEXT_PUBLIC_API_URL`

## Convenciones

- TypeScript estricto
- nombres en ingles para codigo y en español para documentacion
- DTOs y modulos Nest por feature
- componentes React server-first salvo interaccion clara
- placeholders funcionales antes que pantallas vacias

## Despliegue objetivo

- Web: Vercel
- API: Render, Railway o Fly.io en plan barato/gratis
- DB: Neon
