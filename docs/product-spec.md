# Product Spec

## Resumen

Pucho es una aplicacion personal para dejar de fumar o reducir consumo de forma manual. Debe funcionar como web app y como PWA usable desde celular, con persistencia real desde el inicio.

## Objetivo del MVP

Permitir que una persona:

- configure su consumo base y precio por caja
- registre cuantos cigarrillos fuma por dia
- consulte si el dia fue exitoso o incumplido
- visualice progreso en dashboard y calendario
- vea rachas, dinero ahorrado, cigarrillos evitados y medallas

## Decisiones cerradas

- Single-user sin login en la primera etapa
- Diseñada para multiusuario futuro
- Dos modos: dejar por completo y reduccion progresiva manual
- Dark mode como base
- No incluir cravings, estado de animo ni motivos de recaida en esta etapa
- Dias futuros no se pueden editar ni completar
- Dias pasados solo se editan para corregir error humano
- Medallas historicas, nunca se pierden

## Reglas funcionales

### Registro diario

Campos:

- `date`
- `cigarettesSmoked`

### Objetivo diario

Un dia es exitoso si:

- `cigarettesSmoked = 0`, o
- `cigarettesSmoked <= dailyGoal`

### Dias libres mensuales

- valor default: `4`
- configurables
- si hubo incumplimiento pero todavia quedan dias libres, la racha sigue
- se reinician al comenzar cada mes

### Rachas

- aumenta si el dia fue exitoso
- se mantiene si hubo incumplimiento cubierto por dia libre
- se corta si hubo incumplimiento sin dias libres disponibles

### Economia

- `pricePerCigarette = packPrice / 20`
- `baselineDailyConsumption` configurable
- `dailySavings = max(0, (baselineDailyConsumption - cigarettesSmoked) * pricePerCigarette)`

### Horas sin nicotina

- logica simple diaria
- sin timestamps exactos del ultimo cigarrillo
- supuesto MVP: si un dia tuvo `0` cigarrillos suma `24h`; si no, reinicia a `0h`

## Supuestos tomados

- El onboarding crea una configuracion inicial local del unico usuario actual.
- La app trabaja con timezone configurable en el futuro; en el MVP usa una timezone unica definida por el entorno del usuario.
- El calendario muestra estado por dia: exitoso, incumplido cubierto, incumplido que corta racha y vacio.
- Las medallas iniciales se calculan por hitos simples de dias exitosos, rachas y ahorro acumulado.

## Fuera de alcance del MVP

- autenticacion
- multiusuario real
- notificaciones push
- recomendaciones medicas
- importacion/exportacion avanzada
- analytics compleja
