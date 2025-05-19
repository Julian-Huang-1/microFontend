// src/components/ContentList.tsx
import React, { useEffect } from "react";
import { useContentStore } from "../../stores/ContentStore";
import { useAuthStore } from "../../stores/authStore";

export default function ContentList() {
  const { contents, loading, error, fetchContents } = useContentStore();

  useEffect(() => {
    loginAndFetchContents("admin@example.com", "admin123");
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <ul>
      {contents.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}

export async function loginAndFetchContents(email: string, password: string) {
  let authStore = useAuthStore.getState();
  try {
    // 先登录
    // await authStore.login(email, password);

    authStore = useAuthStore.getState();
    const contentStore = useContentStore.getState();
    // 如果登录成功，获取内容
    if (authStore.user) {
    }

    await contentStore.fetchContents();
    return contentStore.contents;

    return null;
  } catch (error) {
    console.error("操作失败:", error);
    return null;
  }
}

export function isUserLoggedIn() {
  return !!useAuthStore.getState().user;
}

export function getCurrentUserRole() {
  return useAuthStore.getState().user?.role;
}
