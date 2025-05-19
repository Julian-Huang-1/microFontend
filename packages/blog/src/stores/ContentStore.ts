// src/stores/contentStore.ts
import { create } from "zustand";
import { trpcClient } from "../utils/trpc";

interface Content {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ContentState {
  contents: Content[];
  currentContent: Content | null;
  total: number;
  isLoading: boolean;
  error: string | null;

  // 操作
  fetchContents: (params?: {
    limit?: number;
    offset?: number;
    status?: "draft" | "published";
  }) => Promise<void>;
  fetchContentById: (id: number) => Promise<void>;
  createContent: (data: {
    title: string;
    slug: string;
    content?: string;
    status?: "draft" | "published";
  }) => Promise<number | undefined>;
  updateContent: (data: {
    id: number;
    title?: string;
    slug?: string;
    content?: string;
    status?: "draft" | "published";
  }) => Promise<boolean>;
  deleteContent: (id: number) => Promise<boolean>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  contents: [],
  currentContent: null,
  total: 0,
  isLoading: false,
  error: null,

  fetchContents: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { limit = 10, offset = 0, status } = params;
      const result = await trpcClient.content.list.query({
        limit,
        offset,
        status,
      });
      set({
        contents: result.items,
        total: result.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "获取内容列表失败",
        isLoading: false,
      });
    }
  },

  fetchContentById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const content = await trpcClient.content.byId.query({ id });
      set({ currentContent: content, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || "获取内容详情失败",
        isLoading: false,
      });
    }
  },

  createContent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await trpcClient.content.create.mutate(data);
      // 创建成功后刷新内容列表
      await get().fetchContents();
      set({ isLoading: false });
      return result.id;
    } catch (error: any) {
      set({
        error: error.message || "创建内容失败",
        isLoading: false,
      });
      return undefined;
    }
  },

  updateContent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await trpcClient.content.update.mutate(data);
      // 更新成功后刷新当前内容和内容列表
      if (get().currentContent?.id === data.id) {
        await get().fetchContentById(data.id);
      }
      await get().fetchContents();
      set({ isLoading: false });
      return result.success;
    } catch (error: any) {
      set({
        error: error.message || "更新内容失败",
        isLoading: false,
      });
      return false;
    }
  },

  deleteContent: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const result = await trpcClient.content.delete.mutate({ id });
      // 删除成功后刷新内容列表
      await get().fetchContents();
      // 如果当前正在查看的内容被删除，清空当前内容
      if (get().currentContent?.id === id) {
        set({ currentContent: null });
      }
      set({ isLoading: false });
      return result.success;
    } catch (error: any) {
      set({
        error: error.message || "删除内容失败",
        isLoading: false,
      });
      return false;
    }
  },
}));
