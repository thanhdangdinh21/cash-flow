import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AccountData,
  AccountDetailData,
  CategoryData,
  CategoryTrendData,
  ContactData,
  HomeReportData,
  LoanData,
  NetWorthReportData,
  SpendingReportData,
  TransactionData,
  TransactionListData,
} from '@/lib/types';

export interface MeData {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  language: string;
  theme: string;
  notificationsOn: boolean;
}

export function useMe() {
  return useQuery<MeData>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });
}

export function useAccounts() {
  return useQuery<AccountData[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
  });
}

export function useAccountDetail(id: string | undefined) {
  return useQuery<AccountDetailData>({
    queryKey: ['accounts', id],
    queryFn: () => api.get(`/accounts/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery<CategoryData[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });
}

export interface TransactionFilters {
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery<TransactionListData>({
    queryKey: ['transactions', filters],
    queryFn: () =>
      api.get('/transactions', { params: { ...filters, limit: 100 } }).then((r) => r.data),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery<TransactionData>({
    queryKey: ['transactions', 'detail', id],
    queryFn: () => api.get(`/transactions/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useContacts() {
  return useQuery<ContactData[]>({
    queryKey: ['contacts'],
    queryFn: () => api.get('/contacts').then((r) => r.data),
  });
}

export function useContactLoans(contactId: string | undefined) {
  return useQuery<LoanData[]>({
    queryKey: ['contacts', contactId, 'loans'],
    queryFn: () =>
      api.get(`/contacts/${contactId}/loans`, { params: { status: 'ACTIVE' } }).then((r) => r.data),
    enabled: !!contactId,
  });
}

export function useHomeReport() {
  return useQuery<HomeReportData>({
    queryKey: ['reports', 'home'],
    queryFn: () => api.get('/reports/home').then((r) => r.data),
  });
}

export function useNetWorthReport(period: 'month' | 'year') {
  return useQuery<NetWorthReportData>({
    queryKey: ['reports', 'net-worth', period],
    queryFn: () => api.get('/reports/net-worth', { params: { period } }).then((r) => r.data),
  });
}

export function useSpendingReport(direction: 'out' | 'in') {
  return useQuery<SpendingReportData>({
    queryKey: ['reports', 'spending', direction],
    queryFn: () =>
      api.get('/reports/spending-by-category', { params: { direction } }).then((r) => r.data),
  });
}

export function useCategoryTrend(categoryId: string | undefined) {
  return useQuery<CategoryTrendData>({
    queryKey: ['reports', 'trend', categoryId],
    queryFn: () => api.get(`/reports/category-trend/${categoryId}`).then((r) => r.data),
    enabled: !!categoryId,
  });
}

// Money mutations cascade: balances feed reports, account details
export function useMoneyInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ['transactions', 'accounts', 'reports', 'contacts']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useDeleteTransaction() {
  const invalidate = useMoneyInvalidation();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: invalidate,
  });
}
