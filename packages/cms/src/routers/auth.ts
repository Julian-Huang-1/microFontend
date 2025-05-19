import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查邮箱是否已存在
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "该邮箱已被注册",
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 创建用户
      const result = await ctx.db
        .insert(users)
        .values({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: "editor", // 默认角色
        })
        .returning({ id: users.id });

      return { success: true, userId: result[0].id };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 查找用户
      const userResult = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (userResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      const user = userResult[0];

      // 验证密码
      const passwordValid = await bcrypt.compare(input.password, user.password);

      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "密码错误",
        });
      }

      // 生成JWT
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  deleteUser: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // 检查用户是否存在
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 防止删除自己
      if (ctx.user.email === input.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不能删除自己的账户",
        });
      }

      // 删除用户
      await ctx.db.delete(users).where(eq(users.email, input.email));

      return { success: true };
    }),
});
