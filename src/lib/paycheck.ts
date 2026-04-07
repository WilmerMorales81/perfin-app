/** Calendar-safe day in month (handles invalid days → last day of month). */
export function dateInMonth(year: number, monthIndex0: number, dayOfMonth: number): Date {
  const last = new Date(year, monthIndex0 + 1, 0).getDate();
  const d = Math.min(dayOfMonth, last);
  return new Date(year, monthIndex0, d, 12, 0, 0, 0);
}

/** All pay dates in `year`, sorted (two per month if payDay2 set). */
export function payDatesInYear(year: number, payDay1: number, payDay2: number | null): Date[] {
  const out: Date[] = [];
  for (let m = 0; m < 12; m++) {
    out.push(dateInMonth(year, m, payDay1));
    if (payDay2 != null) {
      out.push(dateInMonth(year, m, payDay2));
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export type PaycheckAllocation = {
  payDate: Date;
  gross: number;
  bills: { name: string; amount: number; dueDate: Date; category: string | null }[];
  totalBills: number;
  netAfterBills: number;
};

/**
 * Which paycheck pays a bill due on `due` (bi-monthly pay on day1 and day2, day1 < day2).
 *
 * Forward-looking windows (typical U.S. biweekly mental model):
 * - Due on days **1 … (day1−1)** → paid from **day2** of the **previous** month (e.g. Apr 1–5 → Mar 20).
 * - Due on days **day1 … day2** (inclusive) → paid from **day1** of the **same** month (e.g. Apr 6–20 → Apr 6).
 * - Due on days **(day2+1) … 31** → paid from **day2** of the **same** month (e.g. Mar 23–31 → Mar 20).
 */
export function payDateForBillDue(due: Date, payDay1: number, payDay2: number): Date {
  const d = due.getDate();
  const y = due.getFullYear();
  const m = due.getMonth();
  if (d >= 1 && d < payDay1) {
    return dateInMonth(y, m - 1, payDay2);
  }
  if (d >= payDay1 && d <= payDay2) {
    return dateInMonth(y, m, payDay1);
  }
  return dateInMonth(y, m, payDay2);
}

/**
 * Assign each monthly bill occurrence to a paycheck using `payDateForBillDue`.
 * If only one pay day is configured, falls back to “first pay on or after due date”.
 */
export function buildPaycheckAllocations(
  year: number,
  payDay1: number,
  payDay2: number | null,
  grossPerPaycheck: number,
  bills: { name: string; amountUsd: number; dueDayOfMonth: number; category: string | null }[],
): PaycheckAllocation[] {
  const payDates = payDatesInYear(year, payDay1, payDay2);
  const sortedPay = [...payDates].sort((a, b) => a.getTime() - b.getTime());

  const slots = new Map<number, PaycheckAllocation>();
  for (const p of sortedPay) {
    slots.set(p.getTime(), {
      payDate: p,
      gross: grossPerPaycheck,
      bills: [],
      totalBills: 0,
      netAfterBills: grossPerPaycheck,
    });
  }

  const useWindowRule = payDay2 != null && payDay1 < payDay2;

  for (const b of bills) {
    for (let m = 0; m < 12; m++) {
      const dueDate = dateInMonth(year, m, b.dueDayOfMonth);
      const amt = Number(b.amountUsd);

      let pay: Date | undefined;
      if (useWindowRule) {
        pay = payDateForBillDue(dueDate, payDay1, payDay2);
      } else {
        const dueT = dueDate.getTime();
        pay = sortedPay.find((pd) => pd.getTime() >= dueT);
      }
      if (!pay) continue;
      const slot = slots.get(pay.getTime());
      if (!slot) continue;
      slot.bills.push({
        name: b.name,
        amount: amt,
        dueDate,
        category: b.category,
      });
      slot.totalBills += amt;
      slot.netAfterBills = slot.gross - slot.totalBills;
    }
  }

  for (const slot of slots.values()) {
    slot.bills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  return sortedPay.map((pd) => slots.get(pd.getTime())!);
}
