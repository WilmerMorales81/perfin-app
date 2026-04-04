"use server";

import { ExpenseKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  amountUsd: z.coerce.number().positive(),
  description: z.string().max(500).optional(),
  category: z.string().max(120).optional(),
  expenseType: z.enum(["FIXED", "VARIABLE"]),
  occurredOn: z.coerce.date(),
});

export type ExpenseFormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const parsed = schema.safeParse({
    amountUsd: formData.get("amountUsd"),
    description: formData.get("description") || undefined,
    category: formData.get("category") || undefined,
    expenseType: formData.get("expenseType"),
    occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  await prisma.expense.create({
    data: {
      userId: session.sub,
      amountUsd: d.amountUsd,
      description: d.description,
      category: d.category,
      expenseType: d.expenseType as ExpenseKind,
      occurredOn: d.occurredOn,
    },
  });
  revalidatePath("/dashboard");
  return {};
}

export async function deleteExpenseAction(id: string) {
  const session = await getSession();
  if (!session) return;
  await prisma.expense.deleteMany({ where: { id, userId: session.sub } });
  revalidatePath("/dashboard");
}
