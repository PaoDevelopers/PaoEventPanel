import api from "./client";
import type { LoginResponse, User } from "@/types";

export async function login(passkey: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { passkey });
  return data;
}

export async function setAdminPasskey(passkey: string): Promise<void> {
  await api.put("/auth/admin-passkey", { passkey });
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
