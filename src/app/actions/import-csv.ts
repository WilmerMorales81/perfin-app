"use server";

import { parse } from "csv-parse/sync";
import { IncomeSource, ExpenseKind, PlannedDirection } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type ImportResult = {
  ok: true;
  counts: {
    incomes: number;
    expenses: number;
    plannedEvents: number;
    debts: number;
    skipped: number;
    recurringBills: number;
    payScheduleUpdated: number;
  };
  errors: string[];
};

export type ImportError = { ok: false; message: string };

function parseMoney(s: string): number | null {
  const t = s.trim().replace(/^\$/, "");
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function parseDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t + "T12:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseIntDay(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 1 || n > 31) return null;
  return n;
}

/** If `planned_income` / `planned_expense` rows omit `date`, use 1st of next month (monthly budget style). */
function defaultPlannedDate(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 1);
}

const ALLOWED_RECORD = new Set([
  "income",
  "expense",
  "planned_income",
  "planned_expense",
  "debt",
  "pay_schedule",
  "recurring_bill",
]);

export async function importPerfinCsvAction(
  _prev: ImportResult | ImportError | null,
  formData: FormData,
): Promise<ImportResult | ImportError> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Unauthorized." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a CSV file." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, message: "File too large (max 2 MB)." };
  }

  const textRaw = await file.text();
  const text = textRaw.replace(/^\uFEFF/, "");
  let rows: Record<string, string>[];
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    return { ok: false, message: "Invalid CSV format." };
  }

  const normalize = (r: Record<string, string>) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      out[k.toLowerCase().trim()] = v;
    }
    return out;
  };
  rows = rows.map(normalize);

  if (rows.length === 0) {
    return { ok: false, message: "No data rows found." };
  }

  const requiredHeader = "record_type";
  if (!(requiredHeader in rows[0])) {
    return {
      ok: false,
      message: `Missing column "${requiredHeader}". See docs/IMPORT_CSV.md for the required header.`,
    };
  }

  const counts = {
    incomes: 0,
    expenses: 0,
    plannedEvents: 0,
    debts: 0,
    skipped: 0,
    recurringBills: 0,
    payScheduleUpdated: 0,
  };
  const errors: string[] = [];
  const userId = session.sub;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const type = (row.record_type ?? "").toLowerCase().trim();
    if (!type) {
      counts.skipped++;
      continue;
    }
    if (!ALLOWED_RECORD.has(type)) {
      errors.push(`Line ${line}: unknown record_type "${type}"`);
      continue;
    }

    try {
      if (type === "income") {
        const date = parseDate(row.date ?? "");
        const amount = parseMoney(row.amount_usd ?? "");
        const st = (row.subtype ?? "").toUpperCase();
        if (!date || amount === null || amount <= 0) {
          errors.push(`Line ${line}: income needs valid date and amount_usd`);
          continue;
        }
        if (st !== "SALARY" && st !== "OTHER") {
          errors.push(`Line ${line}: income subtype must be SALARY or OTHER`);
          continue;
        }
        await prisma.income.create({
          data: {
            userId,
            occurredOn: date,
            amountUsd: amount,
            sourceType: st as IncomeSource,
            description: row.description?.trim() || null,
          },
        });
        counts.incomes++;
      } else if (type === "expense") {
        const date = parseDate(row.date ?? "");
        const amount = parseMoney(row.amount_usd ?? "");
        const et = (row.subtype ?? "").toUpperCase();
        if (!date || amount === null || amount <= 0) {
          errors.push(`Line ${line}: expense needs valid date and amount_usd`);
          continue;
        }
        if (et !== "FIXED" && et !== "VARIABLE") {
          errors.push(`Line ${line}: expense subtype must be FIXED or VARIABLE`);
          continue;
        }
        await prisma.expense.create({
          data: {
            userId,
            occurredOn: date,
            amountUsd: amount,
            expenseType: et as ExpenseKind,
            description: row.description?.trim() || null,
            category: row.category?.trim() || null,
          },
        });
        counts.expenses++;
      } else if (type === "planned_income") {
        let date = parseDate(row.date ?? "");
        if (!date) date = defaultPlannedDate();
        const amount = parseMoney(row.amount_usd ?? "");
        const st = (row.subtype ?? "").toUpperCase();
        if (amount === null || amount <= 0) {
          errors.push(`Line ${line}: planned_income needs valid amount_usd`);
          continue;
        }
        if (st !== "SALARY" && st !== "OTHER") {
          errors.push(`Line ${line}: planned_income subtype must be SALARY or OTHER`);
          continue;
        }
        await prisma.plannedEvent.create({
          data: {
            userId,
            direction: PlannedDirection.INCOME,
            date,
            amountUsd: amount,
            incomeSource: st as IncomeSource,
            expenseType: null,
            description: row.description?.trim() || null,
            category: null,
          },
        });
        counts.plannedEvents++;
      } else if (type === "planned_expense") {
        let date = parseDate(row.date ?? "");
        if (!date) date = defaultPlannedDate();
        const amount = parseMoney(row.amount_usd ?? "");
        const et = (row.subtype ?? "").toUpperCase();
        if (amount === null || amount <= 0) {
          errors.push(`Line ${line}: planned_expense needs valid amount_usd`);
          continue;
        }
        if (et !== "FIXED" && et !== "VARIABLE") {
          errors.push(`Line ${line}: planned_expense subtype must be FIXED or VARIABLE`);
          continue;
        }
        await prisma.plannedEvent.create({
          data: {
            userId,
            direction: PlannedDirection.EXPENSE,
            date,
            amountUsd: amount,
            incomeSource: null,
            expenseType: et as ExpenseKind,
            description: row.description?.trim() || null,
            category: row.category?.trim() || null,
          },
        });
        counts.plannedEvents++;
      } else if (type === "debt") {
        const name = (row.name ?? "").trim();
        const amount = parseMoney(row.amount_usd ?? "");
        if (!name || amount === null || amount < 0) {
          errors.push(`Line ${line}: debt needs name and amount_usd (balance)`);
          continue;
        }
        const minUsd = row.monthly_min_usd?.trim() ? parseMoney(row.monthly_min_usd!) : null;
        const due = row.due_day?.trim() ? parseIntDay(row.due_day!) : null;
        await prisma.debtAccount.create({
          data: {
            userId,
            name,
            balanceUsd: amount,
            monthlyMinUsd: minUsd !== null && minUsd >= 0 ? minUsd : null,
            dueDayOfMonth: due,
            notes: row.description?.trim() || null,
          },
        });
        counts.debts++;
      } else if (type === "pay_schedule") {
        const d1 = parseIntDay(row.pay_day1 ?? "");
        const d2 = row.pay_day2?.trim() ? parseIntDay(row.pay_day2) : null;
        const amt = parseMoney(row.amount_usd ?? "");
        const py = row.projection_year?.trim()
          ? Number.parseInt(row.projection_year, 10)
          : new Date().getFullYear();
        if (!d1 || amt === null || amt <= 0) {
          errors.push(`Line ${line}: pay_schedule needs pay_day1 and amount_usd (per paycheck)`);
          continue;
        }
        if (Number.isNaN(py) || py < 2000 || py > 2100) {
          errors.push(`Line ${line}: projection_year invalid`);
          continue;
        }
        await prisma.paySchedule.upsert({
          where: { userId },
          create: {
            userId,
            payDay1: d1,
            payDay2: d2,
            amountPerPaycheck: amt,
            projectionYear: py,
          },
          update: {
            payDay1: d1,
            payDay2: d2,
            amountPerPaycheck: amt,
            projectionYear: py,
          },
        });
        counts.payScheduleUpdated++;
      } else if (type === "recurring_bill") {
        const name = (row.name ?? "").trim();
        const amount = parseMoney(row.amount_usd ?? "");
        const due = parseIntDay(row.due_day ?? "");
        if (!name || amount === null || amount <= 0 || due === null) {
          errors.push(`Line ${line}: recurring_bill needs name, amount_usd, due_day (1-31)`);
          continue;
        }
        await prisma.recurringBill.create({
          data: {
            userId,
            name,
            amountUsd: amount,
            dueDayOfMonth: due,
            category: row.category?.trim() || null,
          },
        });
        counts.recurringBills++;
      }
    } catch (e) {
      errors.push(`Line ${line}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cashflow");
  revalidatePath("/dashboard/paycheck-plan");

  return { ok: true, counts, errors };
}
