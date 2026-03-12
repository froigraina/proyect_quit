# Pucho

Aplicacion personal para dejar de fumar, pensada como web app y PWA, con persistencia real y base tecnica preparada para evolucionar a multiusuario.

## Objetivo

El MVP cubre:

- onboarding inicial de configuracion
- dashboard con metricas clave
- registro diario de cigarrillos
- calendario visual
- medallas e hitos historicos
- estadisticas basicas
- configuracion

## Stack

- Monorepo con `pnpm`
- Frontend: Next.js + Tailwind + shadcn/ui
- Backend: NestJS
- Base de datos: PostgreSQL (Neon)
- ORM: Prisma

## Estructura

- `apps/web`: app web y PWA
- `apps/api`: API NestJS
- `packages/config`: configuraciones compartidas
- `docs`: definicion funcional y tecnica

## Documentacion inicial

- [docs/product-spec.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/product-spec.md)
- [docs/technical-spec.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/technical-spec.md)
- [docs/roadmap.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/roadmap.md)
- [docs/backlog.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/backlog.md)
- [docs/deployment.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/deployment.md)

## Arranque rapido

1. Instalar dependencias con `pnpm install`
2. Completar variables de entorno a partir de `.env.example`
3. Levantar desarrollo con `pnpm dev`

Comandos utiles:

- `pnpm dev:web`
- `pnpm dev:api`
- `pnpm --filter api prisma:generate`
- `pnpm --filter api prisma:seed`
- `pnpm lint`

## Persistencia actual

- `profile`, `daily-entries`, `stats` y `achievements` ya estan preparados para Prisma
- auth multiusuario base ya esta activa con `User` + `AuthSession`
- si `DATABASE_URL` no esta configurada, la app corre en modo fallback para no bloquear desarrollo
- `daily-entries` y `stats` ya aceptan filtros por `year` y `month` para vistas mensuales
- cuando configures Neon, corre:
  - `pnpm prisma:migrate:dev --name init`
  - `pnpm --filter api prisma:seed`

## Deploy recomendado

- Web: Vercel Hobby
- API: Render Free
- DB: Neon

Detalle paso a paso en [docs/deployment.md](/c:/Users/fran_/Desktop/dev/Pucho/docs/deployment.md)

## Estado

Este repositorio deja una base spec-anchored: primero definicion y arquitectura, despues bootstrap e implementacion minima funcional, y una segunda etapa con persistencia Prisma-ready y pantallas principales conectadas al API.
