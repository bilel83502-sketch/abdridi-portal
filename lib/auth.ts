"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (email === "admin@abdridi.com" && password === "admin123") {
    redirect("/dashboard");
  }

  return { error: "Email ou mot de passe incorrect" };
}
