import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "abdridi_session";
const SESSION_COOKIE_VALUE = "1";

const DEV_FALLBACK_EMAIL = "dev@abdridi.local";
const DEV_FALLBACK_PASSWORD = "dev-password";

type Credentials = {
  email: string;
  password: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getConfiguredCredentials(): Credentials | null {
  const authEmail = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const authPassword = process.env.AUTH_PASSWORD;

  if (authEmail && authPassword) {
    return { email: authEmail, password: authPassword };
  }

  if (isProduction()) {
    return null;
  }

  return {
    email: DEV_FALLBACK_EMAIL,
    password: DEV_FALLBACK_PASSWORD,
  };
}

async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}

export async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value === SESSION_COOKIE_VALUE;
}

export async function loginAction(formData: FormData): Promise<void> {
  "use server";

  const credentials = getConfiguredCredentials();
  if (!credentials) {
    redirect("/login?error=auth_not_configured");
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (email !== credentials.email || password !== credentials.password) {
    redirect("/login?error=invalid_credentials");
  }

  await setSessionCookie();
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}

export async function requireAuth(): Promise<void> {
  const authed = await isAuthed();
  if (!authed) {
    redirect("/login");
  }
}
