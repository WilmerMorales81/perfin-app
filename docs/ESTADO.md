# Estado del proyecto PERFIN_APP

Actualiza este archivo cuando completes una fase o al cerrar una sesión larga, para que el asistente recupere contexto rápido.

## Última actualización

- **Fecha:** 2026-04-04
- **Sesión:** `PaySchedule` + `RecurringBill`; **Paycheck plan** con regla de **ventanas** (días 1–(p1−1) → 2.º pago mes anterior; p1–p2 → 1.er pago del mes; &gt;p2 → 2.º pago del mes). `IMPORT_CSV.md` incluye **sección “Contexto para continuar”** para IA/sesiones futuras. Cash flow: proyectado incluye mes actual. Pendiente: vista anual, deploy estable en Railway.

## Fases (checklist)

Marca con `[x]` lo completado.

- [x] **Infra / repo:** Next.js + Prisma + `.env.example` + Postgres *(Railway: pegar `DATABASE_URL` en `.env` y `npx prisma db push`)*
- [x] **Auth:** registro/login; datos por usuario *(sesión JWT en cookie `perfin_session`)*
- [x] **MVP datos:** ingresos y gastos (fijo/variable); CRUD
- [x] **Dashboard:** resumen mensual en USD
- [x] **Deudas** (`DebtAccount`) + **eventos planificados** (`PlannedEvent`); import CSV; **Cash flow** histórico (12m) + proyectado (24m)
- [x] **Paycheck plan** (`PaySchedule`, `RecurringBill`); regla de ventanas documentada en `docs/IMPORT_CSV.md`
- [ ] **Vistas anuales** dedicadas y filtros extra
- [ ] **Deploy Vercel** + variables de entorno de producción

## Fases posteriores (no bloquean el MVP)

- [ ] Multi-moneda (COP) y FX en fecha de transacción
- [ ] Etiquetas país/origen para informes (sin sustituir asesor fiscal)
- [ ] Export CSV/PDF, import bancario, PWA, etc.

## Notas libres

(Espacio para decisiones tomadas en código, URLs de Railway/Vercel solo si quieres documentarlas aquí; **no pegues secretos**.)
