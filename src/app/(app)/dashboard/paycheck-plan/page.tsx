import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUsd } from "@/lib/format";
import { buildPaycheckAllocations } from "@/lib/paycheck";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Paycheck plan — PERFIN",
};

export default async function PaycheckPlanPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [schedule, bills] = await Promise.all([
    prisma.paySchedule.findUnique({ where: { userId: session.sub } }),
    prisma.recurringBill.findMany({
      where: { userId: session.sub },
      orderBy: { dueDayOfMonth: "asc" },
    }),
  ]);

  const year = schedule?.projectionYear ?? new Date().getFullYear();

  const rows = schedule
    ? buildPaycheckAllocations(
        year,
        schedule.payDay1,
        schedule.payDay2,
        Number(schedule.amountPerPaycheck),
        bills.map((b) => ({
          name: b.name,
          amountUsd: Number(b.amountUsd),
          dueDayOfMonth: b.dueDayOfMonth,
          category: b.category,
        })),
      )
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Paycheck plan</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Grouping uses <strong>due day</strong> only (same idea as “paycheck 1 covers days A–B, paycheck 2 covers C–D”): days{" "}
            <strong>1–(first pay day − 1)</strong> → previous month’s <strong>second</strong> pay; days{" "}
            <strong>first pay–second pay</strong> (inclusive) → that month’s <strong>first</strong> pay; days{" "}
            <strong>after second pay</strong> → that month’s <strong>second</strong> pay. Example: with pays on the 6th and 20th,
            March 23–31 and April 1–5 → <strong>March 20</strong> deposit; April 6–20 → <strong>April 6</strong> deposit; April
            21–30 and May 1–5 → <strong>April 20</strong> deposit. Year: <strong>{year}</strong>
            {schedule
              ? ` · Pay days: ${schedule.payDay1}${schedule.payDay2 != null ? ` & ${schedule.payDay2}` : ""} · ${formatUsd(Number(schedule.amountPerPaycheck))} per deposit`
              : null}
            .
          </p>
        </div>
        <Link
          href="/dashboard/import"
          className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Import CSV
        </Link>
      </div>

      {!schedule ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          No pay schedule yet. Add a CSV row with <code className="rounded bg-white px-1 dark:bg-zinc-900">record_type=pay_schedule</code> (pay days + amount per paycheck). See{" "}
          <code className="rounded bg-white px-1 dark:bg-zinc-900">docs/IMPORT_CSV.md</code>.
        </div>
      ) : null}

      {schedule && bills.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
          Pay schedule is set, but there are no recurring bills yet. Import rows with{" "}
          <code className="rounded bg-white px-1 dark:bg-zinc-900">record_type=recurring_bill</code> (name, amount, due day of month).
        </div>
      ) : null}

      {schedule && rows.length > 0 ? (
        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <article
              key={row.payDate.getTime()}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {row.payDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-400">Deposit: {formatUsd(row.gross)}</span>
                  <span className="text-zinc-600 dark:text-zinc-400">Bills: {formatUsd(row.totalBills)}</span>
                  <span
                    className={
                      row.netAfterBills >= 0
                        ? "font-medium text-emerald-700 dark:text-emerald-400"
                        : "font-medium text-red-600 dark:text-red-400"
                    }
                  >
                    Left: {formatUsd(row.netAfterBills)}
                  </span>
                </div>
              </header>
              {row.bills.length === 0 ? (
                <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">No bills assigned to this deposit.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {row.bills.map((b, i) => (
                    <li key={`${b.name}-${b.dueDate.getTime()}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.name}</span>
                        {b.category ? (
                          <span className="text-zinc-500 dark:text-zinc-400"> · {b.category}</span>
                        ) : null}
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          Due{" "}
                          {b.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <span className="tabular-nums text-zinc-800 dark:text-zinc-200">{formatUsd(b.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        This view does not replace your spreadsheet: it uses simplified rules. Extra card payments (above minimum) are
        not modeled until you add them as one-off expenses or adjust recurring amounts.
      </p>
    </div>
  );
}
