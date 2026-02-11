"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "abdridi_session";

const VALID_EMAIL = process.env.AUTH_EMAIL ?? "admin@abdridi.com";
const VALID_PASSWORD = process.env.AUTH_PASSWORD ?? "admin123";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    redirect("/login?error=invalid_credentials");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/dashboard");
}

export async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (session !== "1") {
    redirect("/login");
  }

  return { email: VALID_EMAIL };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
