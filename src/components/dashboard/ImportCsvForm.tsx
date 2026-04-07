"use client";

import { useActionState } from "react";
import { importPerfinCsvAction, type ImportError, type ImportResult } from "@/app/actions/import-csv";

type State = ImportResult | ImportError | null;

function isOk(s: State): s is ImportResult {
  return s !== null && "ok" in s && s.ok === true;
}

function isErr(s: State): s is ImportError {
  return s !== null && "ok" in s && s.ok === false;
}

export function ImportCsvForm() {
  const [state, action, pending] = useActionState(importPerfinCsvAction, null);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">CSV file</span>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border file:border-zinc-300 file:bg-zinc-50 file:px-3 file:py-1.5 dark:text-zinc-300 dark:file:border-zinc-600 dark:file:bg-zinc-800"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </form>

      {isErr(state) ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {state.message}
        </p>
      ) : null}

      {isOk(state) ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <p className="font-medium">Import finished</p>
          <ul className="mt-2 list-inside list-disc space-y-0.5">
            <li>Incomes: {state.counts.incomes}</li>
            <li>Expenses: {state.counts.expenses}</li>
            <li>Planned events: {state.counts.plannedEvents}</li>
            <li>Debt accounts: {state.counts.debts}</li>
            <li>Recurring bills: {state.counts.recurringBills}</li>
            <li>Pay schedule updates: {state.counts.payScheduleUpdated}</li>
            <li>Skipped empty rows: {state.counts.skipped}</li>
          </ul>
          {state.errors.length > 0 ? (
            <div className="mt-3 border-t border-emerald-200 pt-3 dark:border-emerald-900">
              <p className="font-medium text-amber-800 dark:text-amber-200">Row warnings</p>
              <ul className="mt-1 max-h-40 list-inside list-disc overflow-y-auto text-xs text-amber-900 dark:text-amber-100">
                {state.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
