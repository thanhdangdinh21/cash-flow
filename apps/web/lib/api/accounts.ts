import { api } from "../api";
import type {
  Account,
  AccountDetail,
  CreateAccountInput,
  CreateHoldingInput,
  Holding,
  UpdateAccountInput,
} from "./types";

export const accountsApi = {
  list: () => api.get<Account[]>("/accounts").then((r) => r.data),
  get: (id: string) =>
    api.get<AccountDetail>(`/accounts/${id}`).then((r) => r.data),
  create: (input: CreateAccountInput) =>
    api.post<Account>("/accounts", input).then((r) => r.data),
  update: (id: string, input: UpdateAccountInput) =>
    api.patch<Account>(`/accounts/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
  addHolding: (accountId: string, input: CreateHoldingInput) =>
    api
      .post<Holding>(`/accounts/${accountId}/holdings`, input)
      .then((r) => r.data),
  removeHolding: (accountId: string, holdingId: string) =>
    api
      .delete(`/accounts/${accountId}/holdings/${holdingId}`)
      .then((r) => r.data),
};
