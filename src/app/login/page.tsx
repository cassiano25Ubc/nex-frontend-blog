import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AuthForm from "../components/AuthForm";

export const metadata: Metadata = {
  title: "Login | Fullstack Blog",
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  await connection();
  const { session } = await searchParams;
  const sessionExpired = Array.isArray(session)
    ? session.includes("expired")
    : session === "expired";

  return <AuthForm mode="login" sessionExpired={sessionExpired} />;
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
