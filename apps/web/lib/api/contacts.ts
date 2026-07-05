import { api } from "../api";
import type { Contact, CreateContactInput, Loan, LoanStatus } from "./types";

export const contactsApi = {
  list: () => api.get<Contact[]>("/contacts").then((r) => r.data),
  create: (input: CreateContactInput) =>
    api.post<Contact>("/contacts", input).then((r) => r.data),
  listLoans: (contactId: string, status?: LoanStatus) =>
    api
      .get<Loan[]>(`/contacts/${contactId}/loans`, { params: { status } })
      .then((r) => r.data),
};
