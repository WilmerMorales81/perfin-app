# Estado del proyecto PERFIN_APP

Actualiza este archivo cuando completes una fase o al cerrar una sesión larga, para que el asistente recupere contexto rápido.

## Última actualización

- **Fecha:** 2026-04-04
- **Sesión:** Scaffold Next.js 16 + Prisma 5 + PostgreSQL schema (User, Income, Expense). Auth por cookie JWT (`jose` + `AUTH_SECRET`). Dashboard mensual en USD con formularios de ingresos/gastos y listas. Infra DB: **Railway** (u otro Postgres); basta `DATABASE_URL` + `npx prisma db push`. Pendiente: deudas/eventos anuales y deploy Vercel.

## Fases (checklist)

Marca con `[x]` lo completado.

- [x] **Infra / repo:** Next.js + Prisma + `.env.example` + Postgres *(Railway: pegar `DATABASE_URL` en `.env` y `npx prisma db push`)*
- [x] **Auth:** registro/login; datos por usuario *(sesión JWT en cookie `perfin_session`)*
- [x] **MVP datos:** ingresos y gastos (fijo/variable); CRUD
- [x] **Dashboard:** resumen mensual en USD
- [ ] **Deudas y productos financieros** + eventos planificados
- [ ] **Vistas anuales** y filtros
- [ ] **Deploy Vercel** + variables de entorno de producción

## Fases posteriores (no bloquean el MVP)

- [ ] Multi-moneda (COP) y FX en fecha de transacción
- [ ] Etiquetas país/origen para informes (sin sustituir asesor fiscal)
- [ ] Export CSV/PDF, import bancario, PWA, etc.

## Notas libres

(Espacio para decisiones tomadas en código, URLs de Railway/Vercel solo si quieres documentarlas aquí; **no pegues secretos**.)
