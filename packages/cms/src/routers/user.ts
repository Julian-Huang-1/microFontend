import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const userRouter = router({
  // 获取用户列表 (仅管理员)
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // 获取单个用户
  byId: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.id));

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      return result[0];
    }),

  // 创建用户 (仅管理员)
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        role: z.enum(["admin", "editor"]).default("editor"),
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
          role: input.role,
        })
        .returning({ id: users.id });

      return { id: result[0].id };
    }),

  // 更新用户
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        email: z.string().email().optional(),
        name: z.string().min(2).optional(),
        role: z.enum(["admin", "editor"]).optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查用户是否存在
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id));

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 检查权限：只有自己或管理员可以更新用户信息
      if (ctx.user.id !== input.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权更新此用户",
        });
      }

      // 只有管理员可以更改角色
      if (input.role && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权更改用户角色",
        });
      }

      // 如果更新邮箱，检查是否与其他用户冲突
      if (input.email && input.email !== existingUser[0].email) {
        const emailExists = await ctx.db
          .select()
          .from(users)
          .where(eq(users.email, input.email));

        if (emailExists.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "该邮箱已被使用",
          });
        }
      }

      // 准备更新数据
      const updateData: any = {};

      if (input.email) updateData.email = input.email;
      if (input.name) updateData.name = input.name;
      if (input.role && ctx.user.role === "admin") updateData.role = input.role;

      // 如果提供了密码，加密后更新
      if (input.password) {
        updateData.password = await bcrypt.hash(input.password, 10);
      }

      // 更新用户
      await ctx.db.update(users).set(updateData).where(eq(users.id, input.id));

      return { success: true };
    }),

  // 删除用户 (仅管理员)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查用户是否存在
      const existingUser = await ctx.db
        .select()
        .from(users)
        .where(eq(users.id, input.id));

      if (existingUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 防止删除自己
      if (ctx.user.id === input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不能删除自己的账户",
        });
      }

      // 删除用户
      await ctx.db.delete(users).where(eq(users.id, input.id));

      return { success: true };
    }),
});
