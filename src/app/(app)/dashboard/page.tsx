import { deleteExpenseAction } from "@/app/actions/expense";
import { deleteIncomeAction } from "@/app/actions/income";
import { ExpenseForm } from "@/components/dashboard/ExpenseForm";
import { IncomeForm } from "@/components/dashboard/IncomeForm";
import { formatUsd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — PERFIN",
};

function monthRange(reference = new Date()) {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { start, end } = monthRange();
  const userId = session.sub;

  const [incomeAgg, expenseAgg, incomes, expenses] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, occurredOn: { gte: start, lte: end } },
      _sum: { amountUsd: true },
    }),
    prisma.expense.aggregate({
      where: { userId, occurredOn: { gte: start, lte: end } },
      _sum: { amountUsd: true },
    }),
    prisma.income.findMany({
      where: { userId, occurredOn: { gte: start, lte: end } },
      orderBy: { occurredOn: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId, occurredOn: { gte: start, lte: end } },
      orderBy: { occurredOn: "desc" },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amountUsd ?? 0);
  const totalExpense = Number(expenseAgg._sum.amountUsd ?? 0);
  const net = totalIncome - totalExpense;

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(start);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as {session.email} · {monthLabel}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Income</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{formatUsd(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{formatUsd(totalExpense)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Net</p>
          <p
            className={`mt-1 text-2xl font-semibold ${net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {formatUsd(net)}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <IncomeForm />
        <ExpenseForm />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Income this month</h2>
          {incomes.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No income entries yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {incomes.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{formatUsd(Number(row.amountUsd))}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {row.sourceType} · {row.occurredOn.toLocaleDateString("en-US")}
                      {row.description ? ` · ${row.description}` : ""}
                    </p>
                  </div>
                  <form>
                    <button
                      type="submit"
                      formAction={deleteIncomeAction.bind(null, row.id)}
                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Expenses this month</h2>
          {expenses.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No expenses yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {expenses.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{formatUsd(Number(row.amountUsd))}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {row.expenseType}
                      {row.category ? ` · ${row.category}` : ""} · {row.occurredOn.toLocaleDateString("en-US")}
                      {row.description ? ` · ${row.description}` : ""}
                    </p>
                  </div>
                  <form>
                    <button
                      type="submit"
                      formAction={deleteExpenseAction.bind(null, row.id)}
                      className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
