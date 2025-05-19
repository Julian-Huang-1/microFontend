import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { contents } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const contentRouter = router({
  // 获取内容列表
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        status: z.enum(["draft", "published"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const query = ctx.db.select().from(contents);

      // 如果指定了状态，则添加状态过滤
      if (input.status) {
        query.where(eq(contents.status, input.status));
      }

      // 如果是普通用户，只能看到已发布的内容
      if (!ctx.user || ctx.user.role !== "admin") {
        query.where(eq(contents.status, "published"));
      }

      const result = await query
        .orderBy(desc(contents.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // 获取总数
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(contents)
        .where(input.status ? eq(contents.status, input.status) : undefined);

      return {
        items: result,
        total: countResult[0].count,
      };
    }),

  // 获取单个内容
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(contents)
        .where(eq(contents.id, input.id));

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "内容不存在",
        });
      }

      const content = result[0];

      // 如果内容是草稿且用户不是作者或管理员，则拒绝访问
      if (
        content.status === "draft" &&
        (!ctx.user ||
          (ctx.user.id !== content.authorId && ctx.user.role !== "admin"))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权访问此内容",
        });
      }

      return content;
    }),

  // 创建内容
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查slug是否已存在
      const existingSlug = await ctx.db
        .select()
        .from(contents)
        .where(eq(contents.slug, input.slug));

      if (existingSlug.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "该slug已存在",
        });
      }

      const result = await ctx.db
        .insert(contents)
        .values({
          title: input.title,
          slug: input.slug,
          content: input.content || "",
          status: input.status,
          authorId: ctx.user.id,
        })
        .returning({ id: contents.id });

      return { id: result[0].id };
    }),

  // 更新内容
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查内容是否存在
      const existingContent = await ctx.db
        .select()
        .from(contents)
        .where(eq(contents.id, input.id));

      if (existingContent.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "内容不存在",
        });
      }

      const content = existingContent[0];

      // 检查权限：只有作者或管理员可以更新
      if (ctx.user.id !== content.authorId && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权更新此内容",
        });
      }

      // 如果更新slug，检查是否与其他内容冲突
      if (input.slug && input.slug !== content.slug) {
        const existingSlug = await ctx.db
          .select()
          .from(contents)
          .where(and(eq(contents.slug, input.slug), sql`id != ${input.id}`));

        if (existingSlug.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "该slug已存在",
          });
        }
      }

      // 更新内容
      await ctx.db
        .update(contents)
        .set({
          title: input.title ?? content.title,
          slug: input.slug ?? content.slug,
          content: input.content ?? content.content,
          status: input.status ?? content.status,
          updatedAt: new Date(),
        })
        .where(eq(contents.id, input.id));

      return { success: true };
    }),

  // 删除内容
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查内容是否存在
      const existingContent = await ctx.db
        .select()
        .from(contents)
        .where(eq(contents.id, input.id));

      if (existingContent.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "内容不存在",
        });
      }

      const content = existingContent[0];

      // 检查权限：只有作者或管理员可以删除
      if (ctx.user.id !== content.authorId && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权删除此内容",
        });
      }

      // 删除内容
      await ctx.db.delete(contents).where(eq(contents.id, input.id));

      return { success: true };
    }),
});
