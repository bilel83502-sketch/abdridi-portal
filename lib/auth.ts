"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE_NAME = "abdridi_session";
const SESSION_EMAIL_COOKIE_NAME = "abdridi_session_email";

const VALID_EMAIL = "admin@abdridi.com";
const VALID_PASSWORD = "password123";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
    redirect("/login?error=invalid_credentials");
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  cookieStore.set(SESSION_EMAIL_COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(SESSION_EMAIL_COOKIE_NAME);

  redirect("/login");
}

export async function requireAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const email = cookieStore.get(SESSION_EMAIL_COOKIE_NAME)?.value;

  if (session !== "1" || !email) {
    redirect("/login");
  }

  return { email };
}
