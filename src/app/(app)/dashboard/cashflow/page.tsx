import Link from "next/link";
import { redirect } from "next/navigation";
import { PlannedDirection } from "@prisma/client";
import { formatUsd } from "@/lib/format";
import { endOfMonth, monthKeyFromDate } from "@/lib/cashflow";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Cash flow — PERFIN",
};

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function CashflowPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const histStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const histEnd = endOfMonth(now.getFullYear(), now.getMonth());

  const [incomes, expenses, debts] = await Promise.all([
    prisma.income.findMany({
      where: { userId: session.sub, occurredOn: { gte: histStart, lte: histEnd } },
      select: { amountUsd: true, occurredOn: true },
    }),
    prisma.expense.findMany({
      where: { userId: session.sub, occurredOn: { gte: histStart, lte: histEnd } },
      select: { amountUsd: true, occurredOn: true },
    }),
    prisma.debtAccount.findMany({
      where: { userId: session.sub },
      select: { monthlyMinUsd: true },
    }),
  ]);

  const histMonthKeys: string[] = [];
  {
    const cur = new Date(histStart);
    while (cur <= histEnd) {
      histMonthKeys.push(monthKeyFromDate(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();
  for (const k of histMonthKeys) {
    incomeByMonth.set(k, 0);
    expenseByMonth.set(k, 0);
  }
  for (const inc of incomes) {
    const k = monthKeyFromDate(inc.occurredOn);
    incomeByMonth.set(k, (incomeByMonth.get(k) ?? 0) + Number(inc.amountUsd));
  }
  for (const ex of expenses) {
    const k = monthKeyFromDate(ex.occurredOn);
    expenseByMonth.set(k, (expenseByMonth.get(k) ?? 0) + Number(ex.amountUsd));
  }

  const totalDebtMin = debts.reduce((s, d) => s + Number(d.monthlyMinUsd ?? 0), 0);

  /** Include current month so rows dated the 1st (e.g. default planned date) are not dropped when that month is still "now". */
  const projRangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const projRangeEnd = endOfMonth(now.getFullYear(), now.getMonth() + 23);

  const planned = await prisma.plannedEvent.findMany({
    where: {
      userId: session.sub,
      date: { gte: projRangeStart, lte: projRangeEnd },
    },
  });

  const projMonthKeys: string[] = [];
  {
    const cur = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 24; i++) {
      projMonthKeys.push(monthKeyFromDate(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  const projIn = new Map<string, number>();
  const projOut = new Map<string, number>();
  for (const k of projMonthKeys) {
    projIn.set(k, 0);
    projOut.set(k, 0);
  }
  for (const p of planned) {
    const k = monthKeyFromDate(p.date);
    const amt = Number(p.amountUsd);
    if (p.direction === PlannedDirection.INCOME) {
      projIn.set(k, (projIn.get(k) ?? 0) + amt);
    } else {
      projOut.set(k, (projOut.get(k) ?? 0) + amt);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Cash flow</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            <strong>Historical</strong> uses only <strong>actual</strong> rows: CSV types <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">income</code> and{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">expense</code>, plus anything you enter on the dashboard.{" "}
            <strong>Projected</strong> uses <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">planned_income</code> /{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">planned_expense</code> (monthly budgets belong here). Debt minimums are a separate recurring estimate.
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Import CSV
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Historical (actual)
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Does not include <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">planned_*</code> CSV rows. To backfill past months, import with{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">expense</code> / <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">income</code> and real dates.
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Month</th>
                <th className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">Income</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Expenses</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Net</th>
              </tr>
            </thead>
            <tbody>
              {histMonthKeys.map((ym) => {
                const inc = incomeByMonth.get(ym) ?? 0;
                const exp = expenseByMonth.get(ym) ?? 0;
                const net = inc - exp;
                return (
                  <tr key={ym} className="border-b border-zinc-100 dark:border-zinc-800/80">
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{monthLabel(ym)}</td>
                    <td className="px-4 py-2.5 text-emerald-700 dark:text-emerald-400">{formatUsd(inc)}</td>
                    <td className="px-4 py-2.5">{formatUsd(exp)}</td>
                    <td
                      className={`px-4 py-2.5 font-medium ${net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatUsd(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Projected (planned events only)
        </h2>
        {totalDebtMin > 0 ? (
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            Estimated recurring debt minimum payments (each month):{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatUsd(totalDebtMin)}</span> — not
            subtracted from the table below; subtract mentally or add planned expenses for paydowns.
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Month</th>
                <th className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">Planned income</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Planned expense</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Net (planned)</th>
              </tr>
            </thead>
            <tbody>
              {projMonthKeys.map((ym) => {
                const inc = projIn.get(ym) ?? 0;
                const exp = projOut.get(ym) ?? 0;
                const net = inc - exp;
                const quiet = inc === 0 && exp === 0;
                return (
                  <tr
                    key={ym}
                    className={`border-b border-zinc-100 dark:border-zinc-800/80 ${quiet ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400">{monthLabel(ym)}</td>
                    <td className="px-4 py-2.5 text-emerald-700 dark:text-emerald-400">{formatUsd(inc)}</td>
                    <td className="px-4 py-2.5">{formatUsd(exp)}</td>
                    <td
                      className={`px-4 py-2.5 font-medium ${net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatUsd(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
