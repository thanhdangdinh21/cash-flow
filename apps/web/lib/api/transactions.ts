import { api } from "../api";
import type {
  CreateTransactionInput,
  ListTransactionsParams,
  Transaction,
  TransactionListResponse,
} from "./types";

export const transactionsApi = {
  list: (params: ListTransactionsParams = {}) =>
    api
      .get<TransactionListResponse>("/transactions", { params })
      .then((r) => r.data),
  get: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
  create: (input: CreateTransactionInput) =>
    api.post<Transaction>("/transactions", input).then((r) => r.data),
  // 204 No Content
  remove: (id: string) =>
    api.delete<void>(`/transactions/${id}`).then(() => undefined),
};
