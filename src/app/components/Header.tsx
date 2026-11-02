import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, logout } from "../lib/api";

async function logoutAction() {
  "use server";
  await logout();
  redirect("/");
}

export default async function Header() {
  const isLoggedIn = (await cookies()).has(AUTH_COOKIE);

  return (
    <header className="navbar bg-base-200 px-4 shadow-sm">
      <div className="navbar-start">
        <Link href="/" className="text-xl font-bold">
          Fullstack Blog
        </Link>
      </div>
      <nav className="navbar-end gap-2">
        {isLoggedIn ? (
          <>
            <Link href="/posts/new" className="btn btn-primary btn-sm">
              Criar post
            </Link>
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
    </header>
  );
}
