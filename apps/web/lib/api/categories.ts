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
  // 204 No Content
  remove: (id: string) =>
    api.delete<void>(`/categories/${id}`).then(() => undefined),
  addSubCategory: (categoryId: string, input: CreateSubCategoryInput) =>
    api
      .post<SubCategory>(`/categories/${categoryId}/sub-categories`, input)
      .then((r) => r.data),
  // 204 No Content
  removeSubCategory: (categoryId: string, subId: string) =>
    api
      .delete<void>(`/categories/${categoryId}/sub-categories/${subId}`)
      .then(() => undefined),
};
