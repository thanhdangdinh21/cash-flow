import { api } from "../api";
import type { UpdateUserInput, User } from "./types";

export const usersApi = {
  me: () => api.get<User>("/users/me").then((r) => r.data),
  updateMe: (input: UpdateUserInput) =>
    api.patch<User>("/users/me", input).then((r) => r.data),
};
