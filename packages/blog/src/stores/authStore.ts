// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trpcClient } from "../utils/trpc";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // 操作
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await trpcClient.auth.login.mutate({
            email,
            password,
          });
          set({
            user: result.user,
            token: result.token,
            isLoading: false,
          });
          // 更新localStorage以便httpBatchLink可以使用新token
          localStorage.setItem("token", result.token);
        } catch (error: any) {
          set({
            error: error.message || "登录失败",
            isLoading: false,
          });
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          await trpcClient.auth.register.mutate({ email, password, name });
          // 注册成功后自动登录
          await get().login(email, password);
        } catch (error: any) {
          set({
            error: error.message || "注册失败",
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("token");
      },

      fetchUserProfile: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true, error: null });
        try {
          const user = await trpcClient.auth.me.query();
          set({ user, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "获取用户信息失败",
            isLoading: false,
          });
          // 如果token无效，清除登录状态
          if (error.data?.code === "UNAUTHORIZED") {
            get().logout();
          }
        }
      },
    }),
    {
      name: "auth-storage",
      // 只持久化token，其他状态在应用启动时重新获取
      partialize: (state) => ({ token: state.token }),
    }
  )
);
