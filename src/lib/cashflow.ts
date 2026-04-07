/** Month key YYYY-MM in local calendar */
export function monthKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function startOfMonth(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0, 1);
}

export function endOfMonth(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
}

export function eachMonthKey(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let y = from.getFullYear();
  let m = from.getMonth();
  const endY = to.getFullYear();
  const endM = to.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    keys.push(`${y}-${String(m + 1).padStart(2, "0")}`);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return keys;
}
