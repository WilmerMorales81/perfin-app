import { ImportCsvForm } from "@/components/dashboard/ImportCsvForm";

export const metadata = {
  title: "Import CSV — PERFIN",
};

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Import CSV</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Bulk-load transactions and debts. See <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">docs/IMPORT_CSV.md</code>{" "}
          for the exact CSV columns and a prompt you can paste into ChatGPT or Claude.
        </p>
      </div>
      <ImportCsvForm />
    </div>
  );
}
