import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ApiError,
  AUTH_COOKIE,
  getMe,
  logout,
  type UserProfile,
} from "../lib/api";
import CheckoutButton from "./CheckoutButton";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Header() {
  await connection();
  let user: UserProfile | null = null;
  let sessionError = false;

  if ((await cookies()).has(AUTH_COOKIE)) {
    try {
      user = await getMe();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect("/session/expired");
      }
      if (!(error instanceof ApiError)) throw error;
      sessionError = true;
    }
  }

  return (
    <header className="navbar bg-base-200 px-4 shadow-sm">
      <div className="navbar-start">
        <Link href="/" className="text-xl font-bold">
          Fullstack Blog
        </Link>
      </div>
      <nav className="navbar-end gap-2">
        {user ? (
          <>
            <span className="hidden text-sm sm:inline">
              Olá, {user.name}
            </span>
            <Link href="/posts/new" className="btn btn-primary btn-sm">
              Criar post
            </Link>
            {user.premium ? (
              <span className="badge badge-accent">Premium</span>
            ) : (
              <CheckoutButton />
            )}
            <form action={logoutAction}>
              <button type="submit" className="btn btn-outline btn-sm">
                Sair
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Cadastro
            </Link>
          </>
        )}
      </nav>
      {sessionError && (
        <p className="ml-3 text-xs text-warning" role="status">
          Não foi possível validar sua sessão agora.
        </p>
      )}
    </header>
  );
}
