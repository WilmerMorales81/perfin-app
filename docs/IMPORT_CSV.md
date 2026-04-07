# PERFIN — CSV import format

Use a **single UTF-8 CSV file** with a **header row**. Column names are **case-insensitive**. Dates use **`YYYY-MM-DD`**. Amounts are in **USD** (number; optional `$`).

## Full header (recommended)

Include every column so **pay schedule** and **recurring bills** work:

```text
record_type,date,amount_usd,subtype,description,category,name,monthly_min_usd,due_day,pay_day1,pay_day2,projection_year
```

Older files with only the first 9 columns still work for `income` / `expense` / `planned_*` / `debt`.

| Column | Used for |
|--------|----------|
| `record_type` | See table below |
| `date` | Required for `income` / `expense`; optional for `planned_*` (default: 1st of next month); optional for `debt` |
| `amount_usd` | Amount in USD (or per-paycheck amount for `pay_schedule`) |
| `subtype` | `SALARY` / `OTHER` / `FIXED` / `VARIABLE` depending on row type |
| `description` | Free text |
| `category` | Optional |
| `name` | Required for `debt` and `recurring_bill` |
| `monthly_min_usd` | Optional; for `debt` — minimum payment |
| `due_day` | For `debt` or **`recurring_bill`** — calendar day 1–31 |
| `pay_day1`, `pay_day2` | For **`pay_schedule`** only — paydays each month (e.g. 6 and 20, or 7 and 22); must satisfy `pay_day1 < pay_day2` |
| `projection_year` | For **`pay_schedule`** — year for the Paycheck plan grid (e.g. 2026) |

## `record_type` values

| record_type | Meaning |
|-------------|---------|
| `income` | **Actual** income → **Cash flow → Historical** |
| `expense` | **Actual** expense → **Historical** |
| `planned_income` / `planned_expense` | Budget / future one-offs → **Cash flow → Projected** |
| `debt` | Card/loan snapshot (balance, min, due day) |
| **`pay_schedule`** | **One row per user (upsert):** `amount_usd` = net per deposit, `pay_day1` / `pay_day2`, `projection_year` |
| **`recurring_bill`** | Monthly obligation: `name`, `amount_usd`, `due_day` (day of month), optional `category` |

**Paycheck plan** (`/dashboard/paycheck-plan`): assigns each **recurring bill** to a **paycheck using calendar windows**, not “first deposit on or after due date”. See **Contexto** below.

**Important:** `planned_expense` does **not** fill **Historical**; use `expense` with real past dates for that.

## Example CSV (snippet)

```csv
record_type,date,amount_usd,subtype,description,category,name,monthly_min_usd,due_day,pay_day1,pay_day2,projection_year
pay_schedule,,1900,,,,,,,,7,22,2026
recurring_bill,,1475,,,Housing,RENT,,1,,,
recurring_bill,,150,,,Credit,BoFA card,,1,,,
income,2026-03-01,4100,SALARY,Payroll,,
```

## Prompt for ChatGPT or Claude (updated)

```
You are helping export data into a CSV for the app PERFIN.

Output ONLY valid CSV (no markdown), UTF-8, with this exact header:

record_type,date,amount_usd,subtype,description,category,name,monthly_min_usd,due_day,pay_day1,pay_day2,projection_year

Rules:
- pay_schedule: one row with amount_usd = net per paycheck, pay_day1 and pay_day2 (e.g. 7 and 22), projection_year = 2026
- recurring_bill: one row per fixed monthly bill — name, amount_usd, due_day = calendar day due (1-31), optional category
- income/expense: actual past transactions with dates
- planned_income/planned_expense: optional budget lines; subtype SALARY/OTHER or FIXED/VARIABLE
- debt: balances with name, amount_usd = balance, optional monthly_min_usd and due_day

Convert the user’s spreadsheet (obligations, due days, cuotas) into recurring_bill rows and add pay_schedule from their pay dates and amount per deposit.

[PASTE NOTES OR TABLE HERE]
```

## After import

- **Cash flow** — historical vs projected (planned rows).
- **Paycheck plan** — deposit dates in `projection_year` with bills assigned per **window rule** (see below).

---

## Contexto para continuar (futuras sesiones / IA)

### Qué es PERFIN (recordatorio)

- App **Next.js** + **Prisma** + **PostgreSQL** (Railway); UI en **inglés**; moneda **USD**; chat del dueño en **español** (ver `AGENTS.md`).
- Rutas útiles: `/dashboard` (mes actual), `/dashboard/cashflow`, `/dashboard/import`, `/dashboard/paycheck-plan`.

### Modelos de datos relevantes al CSV

| Modelo | Uso |
|--------|-----|
| `Income` / `Expense` | Transacciones **reales** (histórico) |
| `PlannedEvent` | `planned_*` en CSV |
| `DebtAccount` | filas `debt` |
| `PaySchedule` | una fila por usuario: días de pago y monto por depósito |
| `RecurringBill` | obligaciones mensuales con **día del mes** de vencimiento |

### Cash flow: histórico vs proyectado

- **Historical (actual):** solo suma `Income` + `Expense` con fechas en el rango.
- **Projected:** solo `planned_income` / `planned_expense`; la tabla proyectada incluye el **mes actual** en adelante (no solo “mes siguiente”).
- Los `planned_expense` **no** rellenan histórico; para meses pasados reales usa `expense` con fechas.

### Paycheck plan: regla de ventanas (implementada en código)

Con **dos pagos al mes** (`pay_day1` &lt; `pay_day2`, p. ej. 6 y 20 o 7 y 22), para una factura **recurrente** con vencimiento el **día D** del mes:

1. **Días 1 … (pay_day1 − 1)** → se asigna al **segundo** pago del **mes anterior** (ej. 1–5 de abril → depósito del **20 de marzo**).
2. **Días pay_day1 … pay_day2 (inclusive)** → se asigna al **primer** pago de **ese** mes (ej. 6–20 de abril → depósito del **6 de abril**).
3. **Días (pay_day2 + 1) … 31** → se asigna al **segundo** pago de **ese** mes (ej. 23–31 de marzo → depósito del **20 de marzo**).

Esto coincide con la idea: *“el ingreso del 6 cubre obligaciones del 6 al 20; el del 20 cubre del 21 al 5 del mes siguiente”* (ajustando por mes calendario).

**No** se usa ya la regla antigua “primer depósito en o después del vencimiento” para `recurring_bill` cuando hay dos días de pago.

### Importante

- **No** se sube el `.env` al repo; solo `.env.example`.
- Tras cambios en `schema.prisma`: `npx prisma db push` y `npx prisma generate` (si el servidor está en marcha, a veces hace falta parar `npm run dev` para evitar EPERM en Windows).

### Otros documentos

- `AGENTS.md` — preferencias y stack.
- `docs/ESTADO.md` — checklist y última sesión.
- `docs/PLAN_FINANZAS_PERSONALES.md` — visión de producto.
