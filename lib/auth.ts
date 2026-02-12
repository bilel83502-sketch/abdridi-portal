import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "abdridi_session";

const DEV_FALLBACK_EMAIL = "dev@abdridi.local";
const DEV_FALLBACK_PASSWORD = "dev-password";

function getExpectedCredentials() {
  return {
    email: (process.env.AUTH_EMAIL ?? DEV_FALLBACK_EMAIL).trim().toLowerCase(),
    password: process.env.AUTH_PASSWORD ?? DEV_FALLBACK_PASSWORD,
  };
}

export async function loginAction(formData: FormData): Promise<void> {
  "use server";
  const { email: expectedEmail, password: expectedPassword } = getExpectedCredentials();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (email !== expectedEmail || password !== expectedPassword) {
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

export async function logoutAction(): Promise<void> {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function requireAuth(): Promise<{ email: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (session !== "1") {
    redirect("/login");
  }

  const { email } = getExpectedCredentials();
  const [name, domain] = email.split("@");
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : "us***";

  return { email: `${maskedName}@${domain ?? "abdridi.com"}` };
}
