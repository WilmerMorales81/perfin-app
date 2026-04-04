# Plan: aplicación de finanzas personales (PERFIN_APP)

> Copia de trabajo del plan acordado. Si cambias decisiones, actualiza este archivo y [AGENTS.md](../AGENTS.md). El plan canónico en Cursor también vive en `.cursor/plans/` (nombre: app finanzas personales).

## Objetivo del producto

Aplicación web **multiusuario** para gestionar finanzas personales: ingresos (nómina + extras), gastos **fijos y variables**, deudas/productos financieros, planificación con fechas (bonos, pagos a tarjetas), vistas **mensuales y anuales**. Decisiones informadas sobre presupuesto y flujo de caja.

## Tipo de aplicación

- **Web responsive** (PWA opcional más adelante).
- **PostgreSQL** (p. ej. **Railway**) + **Vercel** (Next.js) — infra que ya usas.

## Stack acordado

| Capa | Elección |
|------|----------|
| Framework | Next.js (App Router) + TypeScript |
| Datos | Prisma + PostgreSQL (Railway u otro host) |
| Auth | NextAuth (Auth.js) u otro (Clerk, etc.) |
| UI | Tailwind + componentes (p. ej. shadcn/ui) |
| Validación | Zod |

Alternativa mencionada: FastAPI + React + mismo Postgres (más piezas).

## Idioma y moneda

- **Interfaz de usuario (UX): inglés** — copy, errores, dashboard.
- **Conversación con el desarrollador / dueño del proyecto: español** (preferencia).
- **Moneda v1: USD** en todos los montos.
- **Futuro:** COP y otras monedas; conversión a USD con **FX en fecha de transacción** (modelo: `currency`, `amount`, `amountInBaseCurrency`, `fxRate`, `fxDate`).

## Uso familiar y jurisdicción

- Un **usuario por persona** (ej. tú y tu hijo en California); datos aislados.
- Reglas fiscales distintas (EE.UU. vs Colombia): la app **no es asesor fiscal**; MVP con **categorías y notas**. Más adelante: etiquetas país/origen opcionales, no “motor fiscal” completo salvo que se planifique aparte.

## Modelo de datos (MVP)

- Usuario, períodos (vistas mensual/anual).
- Ingresos, gastos (fijo / variable), deudas/productos financieros, eventos planificados.

## Prompt inicial para Cursor (inglés — alinear con UI)

```
You are a senior developer. Build a personal finance web app.

Product
1. Multi-user authentication; each user only sees their own data.
2. Income: salary, plus additional (stock sales, side work, etc.) with amounts, dates, notes, recurrence where relevant. Default currency: USD.
3. Expenses: fixed vs variable (rent/mortgage, utilities, recurring financial products vs fuel, food, discretionary).
4. Debts / financial products: balances, statement/payment dates, planned paydowns.
5. Planning: future events (e.g. bonus in two months) and optional links to pay down a card or allocate savings on a date.
6. Views: monthly and annual summaries, filters.
7. UI: intuitive, simple, modern dashboard; all user-facing strings in English.

Technical
- Next.js (App Router) + TypeScript + Prisma + PostgreSQL.
- Database: PostgreSQL — use `DATABASE_URL` from environment variables (document `.env.example`).
- Deployment target: Vercel (document required env vars).
- Typed API routes or server actions, Zod validation, sensible relational schema.

Phased delivery: (1) auth + schema + income/expense CRUD + monthly dashboard in USD; (2) debts + planned events + annual views.

First concrete task: scaffold the app, Prisma schema, auth, and first monthly summary screen (optional seed data).
```

## Fuera del MVP inicial

- Multi-moneda + COP + FX.
- Export CSV/PDF, import bancario, recordatorios email, gráficos avanzados, tests automatizados (se pueden añadir progresivamente).

## Referencias de archivos en el repo

| Archivo | Propósito |
|---------|-----------|
| [AGENTS.md](../AGENTS.md) | Instrucciones cortas para el asistente de IA |
| [docs/ESTADO.md](ESTADO.md) | Seguimiento de fases y última sesión (actualizar al avanzar) |
