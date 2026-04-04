# AGENTS — PERFIN_APP (finanzas personales)

Lee esto al abrir el proyecto si el contexto es nuevo o se reinició la conversación.

## Qué es este proyecto

App web **personal de finanzas**: ingresos, gastos fijos/variables, deudas, planificación por fechas, vistas mensuales/anuales. **Varios usuarios** (datos aislados). Objetivo: presupuesto y decisiones (bonos, pagos a tarjetas, etc.).

## Preferencias del dueño

- **Chat / explicaciones:** español.
- **Interfaz de la aplicación:** **inglés** (todos los textos visibles al usuario).
- **Moneda inicial:** **USD**. COP y tipo de cambio: fase posterior (ver plan).

## Stack e infra (no improvisar sin acuerdo)

- **Next.js** (App Router) + **TypeScript** + **Prisma** + **PostgreSQL** (p. ej. **Railway**) + deploy **Vercel**.
- Variables: `DATABASE_URL` (cualquier Postgres compatible), `AUTH_SECRET` (cookie JWT). Auth implementada con **sesión JWT** (`jose`), no NextAuth (evita conflictos de peer deps con Next 16).

## Documentos fuente de verdad

1. **[docs/PLAN_FINANZAS_PERSONALES.md](docs/PLAN_FINANZAS_PERSONALES.md)** — plan completo, prompt inicial en inglés, decisiones de producto.
2. **[docs/ESTADO.md](docs/ESTADO.md)** — qué fase está hecha y notas de la última sesión (actualizar cuando se complete trabajo).

Si el plan en Cursor (`.cursor/plans/`) difiere, **prioriza lo acordado en `docs/PLAN_FINANZAS_PERSONALES.md`** y alinea ambos.

## Cómo continuar el trabajo

1. Leer `docs/ESTADO.md` y el plan.
2. No refactors masivos no pedidos; cambios acotados al objetivo actual.
3. Tras cambios importantes, actualizar `docs/ESTADO.md` (fecha, fase, notas).

## Alcance no prometido en MVP

Motor fiscal por país, declaraciones de impuestos, asesoría legal. Etiquetas/metadata de jurisdicción pueden venir después.
