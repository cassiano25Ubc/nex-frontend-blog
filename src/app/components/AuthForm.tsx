"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type AuthActionState,
} from "../auth-actions";

type AuthMode = "login" | "register";

const initialState: AuthActionState = {};

export default function AuthForm({
  mode,
  sessionExpired = false,
}: {
  mode: AuthMode;
  sessionExpired?: boolean;
}) {
  const isRegister = mode === "register";
  const action = isRegister ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="grid min-h-[65vh] items-center gap-8 py-8 lg:grid-cols-2 lg:gap-16">
      <div className="flex flex-col gap-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Fullstack Blog
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          {isRegister ? "Sua próxima ideia começa aqui." : "Que bom ter você de volta."}
        </h1>
        <p className="max-w-lg text-lg text-base-content/70">
          {isRegister
            ? "Crie sua conta para compartilhar histórias, trocar ideias e participar da conversa."
            : "Entre para continuar a conversa, compartilhar ideias e acompanhar seus posts favoritos."}
        </p>
        <div className="hidden items-center gap-3 pt-2 text-sm text-base-content/60 sm:flex">
          <span className="h-px w-10 bg-primary" />
          Um espaço para boas histórias.
        </div>
      </div>

      <div className="card w-full border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body gap-5 p-6 sm:p-8">
          <div className="flex flex-col gap-1">
            <h2 className="card-title text-2xl">
              {isRegister ? "Criar conta" : "Fazer login"}
            </h2>
            <p className="text-sm text-base-content/65">
              {isRegister
                ? "Preencha os dados para começar."
                : "Informe seus dados para acessar sua conta."}
            </p>
          </div>

          {sessionExpired && (
            <div role="status" className="alert alert-warning">
              <span>Sua sessão expirou. Entre novamente para continuar.</span>
            </div>
          )}

          {state.error && (
            <div role="alert" className="alert alert-error">
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="flex flex-col gap-4">
            {isRegister && (
              <label className="form-control flex flex-col gap-2">
                <span className="label-text font-medium">Nome</span>
                <input
                  autoComplete="name"
                  className={`input w-full ${state.fieldErrors?.name ? "input-error" : ""}`}
                  id="name"
                  maxLength={100}
                  name="name"
                  placeholder="Como podemos chamar você?"
                  required
                  aria-invalid={Boolean(state.fieldErrors?.name)}
                  aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
                />
                {state.fieldErrors?.name && (
                  <span className="text-sm text-error" id="name-error">
                    {state.fieldErrors.name}
                  </span>
                )}
              </label>
            )}

            <label className="form-control flex flex-col gap-2">
              <span className="label-text font-medium">E-mail</span>
              <input
                autoComplete="email"
                className={`input w-full ${state.fieldErrors?.email ? "input-error" : ""}`}
                id="email"
                name="email"
                placeholder="voce@exemplo.com"
                required
                type="email"
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
              />
              {state.fieldErrors?.email && (
                <span className="text-sm text-error" id="email-error">
                  {state.fieldErrors.email}
                </span>
              )}
            </label>

            <label className="form-control flex flex-col gap-2">
              <span className="label-text font-medium">Senha</span>
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                className={`input w-full ${state.fieldErrors?.password ? "input-error" : ""}`}
                id="password"
                minLength={6}
                name="password"
                placeholder="Pelo menos 6 caracteres"
                required
                type="password"
                aria-invalid={Boolean(state.fieldErrors?.password)}
                aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
              />
              {state.fieldErrors?.password && (
                <span className="text-sm text-error" id="password-error">
                  {state.fieldErrors.password}
                </span>
              )}
            </label>

            <button className="btn btn-primary mt-2 w-full" disabled={pending} type="submit">
              {pending && <span className="loading loading-spinner loading-sm" />}
              {pending
                ? isRegister
                  ? "Criando conta..."
                  : "Entrando..."
                : isRegister
                  ? "Criar conta"
                  : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/70">
            {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Link
              className="link link-hover font-semibold text-primary"
              href={isRegister ? "/login" : "/register"}
            >
              {isRegister ? "Fazer login" : "Cadastre-se"}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
