import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { media } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const mediaRouter = router({
  // 获取媒体列表
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(media)
        .orderBy(desc(media.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // 获取单个媒体
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(media)
        .where(eq(media.id, input.id));

      if (result.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "媒体不存在",
        });
      }

      return result[0];
    }),

  // 创建媒体记录
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
        type: z.string().min(1),
        size: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(media)
        .values({
          name: input.name,
          url: input.url,
          type: input.type,
          size: input.size,
          uploadedById: ctx.user.id,
        })
        .returning({ id: media.id });

      return { id: result[0].id };
    }),

  // 删除媒体
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查媒体是否存在
      const existingMedia = await ctx.db
        .select()
        .from(media)
        .where(eq(media.id, input.id));

      if (existingMedia.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "媒体不存在",
        });
      }

      const mediaItem = existingMedia[0];

      // 检查权限：只有上传者或管理员可以删除
      if (ctx.user.id !== mediaItem.uploadedById && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "无权删除此媒体",
        });
      }

      // 删除媒体记录
      await ctx.db.delete(media).where(eq(media.id, input.id));

      // 注意：这里只删除了数据库记录，实际文件的删除需要额外处理

      return { success: true };
    }),
});
