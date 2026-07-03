import { api } from "../api";
import type {
  Category,
  CreateCategoryInput,
  CreateSubCategoryInput,
  SubCategory,
  UpdateCategoryInput,
} from "./types";

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories").then((r) => r.data),
  create: (input: CreateCategoryInput) =>
    api.post<Category>("/categories", input).then((r) => r.data),
  update: (id: string, input: UpdateCategoryInput) =>
    api.patch<Category>(`/categories/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
  addSubCategory: (categoryId: string, input: CreateSubCategoryInput) =>
    api
      .post<SubCategory>(`/categories/${categoryId}/sub-categories`, input)
      .then((r) => r.data),
  removeSubCategory: (categoryId: string, subId: string) =>
    api
      .delete(`/categories/${categoryId}/sub-categories/${subId}`)
      .then((r) => r.data),
};
