import { api } from "../api";
import type { AuthResponse, LoginInput, RegisterInput } from "./types";

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<AuthResponse>("/auth/register", input).then((r) => r.data),
  login: (input: LoginInput) =>
    api.post<AuthResponse>("/auth/login", input).then((r) => r.data),
};
