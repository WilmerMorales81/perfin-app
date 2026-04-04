"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
} from "@/lib/session";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const DB_UNAVAILABLE =
  "Cannot connect to the database. In .env set DATABASE_URL to your Railway Postgres connection string (copy it from the Railway dashboard), then run: npx prisma db push";

function isDbUnreachable(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P1001" || e.code === "P1000";
  }
  return false;
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, password, name } = parsed.data;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "An account with this email already exists." };
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null },
    });
    const token = await createSessionToken({ sub: user.id, email: user.email });
    await setSessionCookie(token);
  } catch (e) {
    if (isDbUnreachable(e)) return { error: DB_UNAVAILABLE };
    throw e;
  }
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { email, password } = parsed.data;
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    if (isDbUnreachable(e)) return { error: DB_UNAVAILABLE };
    throw e;
  }
  if (!user) {
    return { error: "Invalid email or password." };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }
  const token = await createSessionToken({ sub: user.id, email: user.email });
  await setSessionCookie(token);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
