"use server";

import { IncomeSource } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const schema = z.object({
  amountUsd: z.coerce.number().positive(),
  description: z.string().max(500).optional(),
  sourceType: z.enum(["SALARY", "OTHER"]),
  occurredOn: z.coerce.date(),
});

export type IncomeFormState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createIncomeAction(
  _prev: IncomeFormState,
  formData: FormData,
): Promise<IncomeFormState> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized." };

  const parsed = schema.safeParse({
    amountUsd: formData.get("amountUsd"),
    description: formData.get("description") || undefined,
    sourceType: formData.get("sourceType"),
    occurredOn: formData.get("occurredOn"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  await prisma.income.create({
    data: {
      userId: session.sub,
      amountUsd: d.amountUsd,
      description: d.description,
      sourceType: d.sourceType as IncomeSource,
      occurredOn: d.occurredOn,
    },
  });
  revalidatePath("/dashboard");
  return {};
}

export async function deleteIncomeAction(id: string) {
  const session = await getSession();
  if (!session) return;
  await prisma.income.deleteMany({ where: { id, userId: session.sub } });
  revalidatePath("/dashboard");
}
