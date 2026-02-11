"use server";

import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  // ⚡ Auth ultra simple (temporaire)
  if (email === "admin@abdridi.com" && password === "admin123") {
    redirect("/dashboard");
  }

  return { error: "Email ou mot de passe incorrect" };
}
