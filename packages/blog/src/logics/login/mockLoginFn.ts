import type { loginFnProps } from "./loginMachine";

export const mockLoginFn = ({
  email,
  password,
  signal,
}: loginFnProps): Promise<{
  token: string;
  user: { id: string; email: string };
}> => {
  // 模拟服务器延迟 (2-4秒随机)
  //   const delay = 2000 + Math.random() * 2000;
  const delay = 10000;
  return new Promise((resolve, reject) => {
    // 检查是否已经被取消
    if (signal?.aborted) {
      return reject(
        new DOMException("The operation was aborted", "AbortError")
      );
    }

    // 创建超时定时器 ID，用于后续可能的清除
    const timeoutId = setTimeout(() => {
      // 模拟登录逻辑
      if (email === "test@example.com" && password === "password") {
        resolve({
          token: "mock-jwt-token-" + Math.random().toString(36).substring(2),
          user: {
            id: "user-123",
            email,
          },
        });
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, delay);

    // 如果有 signal，添加 abort 事件监听器
    if (signal) {
      // 当 abort 信号触发时清除定时器并拒绝 Promise
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timeoutId);
          reject(new Error("The operation was aborted"));
        },
        { once: true }
      ); // once 选项确保监听器只触发一次
    }
    console.log("请求接口！", signal);
  });
};
