import { initTRPC, TRPCError } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

// JWT密钥，实际应用中应该从环境变量获取
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type User = { id: number; email: string; role: string } | null;

// 创建上下文类型
export interface Context {
  db: typeof db;
  user: User;
}

// 创建上下文;
export const createContext = async ({
  req,
}: CreateNextContextOptions): Promise<Context> => {
  let user: User = null;
  console.log(req.headers.authorization);
  // 从请求头中获取token
  const token = req.headers.authorization;
  if (token) {
    try {
      // 验证token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

      // 获取用户信息
      const userResult = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, decoded.id));

      if (userResult.length > 0) {
        user = userResult[0] as User;
      }
    } catch (error) {
      // Token验证失败，用户为null
    }
  }

  return { db, user };
};

// 初始化tRPC
const t = initTRPC.context<Context>().create();

// 中间件：检查用户是否已认证
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 中间件：检查用户是否为管理员
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理员权限" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 导出tRPC工具
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const adminProcedure = t.procedure.use(isAdmin);
