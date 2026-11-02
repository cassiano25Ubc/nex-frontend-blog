"use server";

import { redirect } from "next/navigation";
import { ApiError, login, register } from "./lib/api";

export type AuthField = "name" | "email" | "password";

export interface AuthActionState {
  error?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
}

function readText(formData: FormData, field: AuthField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getApiErrorMessage(error: ApiError, action: "login" | "register") {
  if (error.code === "NETWORK_ERROR") {
    return "Não foi possível conectar ao servidor. Tente novamente.";
  }
  if (action === "login" && error.status === 401) {
    return "E-mail ou senha incorretos.";
  }
  if (action === "register" && error.status === 409) {
    return "Este e-mail já está cadastrado. Faça login.";
  }
  return error.message;
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readText(formData, "email").trim().toLowerCase();
  const password = readText(formData, "password");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!validEmail(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (password.length < 6) {
    fieldErrors.password = "A senha deve ter pelo menos 6 caracteres.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await login({ email, password });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: getApiErrorMessage(error, "login") };
    }
    throw error;
  }

  redirect("/");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = readText(formData, "name").trim();
  const email = readText(formData, "email").trim().toLowerCase();
  const password = readText(formData, "password");
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!name || name.length > 100) {
    fieldErrors.name = "Informe seu nome (até 100 caracteres).";
  }
  if (!validEmail(email)) fieldErrors.email = "Informe um e-mail válido.";
  if (password.length < 6) {
    fieldErrors.password = "A senha deve ter pelo menos 6 caracteres.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await register({ name, email, password });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: getApiErrorMessage(error, "register") };
    }
    throw error;
  }

  redirect("/");
}
