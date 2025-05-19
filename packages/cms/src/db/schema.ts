import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 用户表
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("editor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 内容表
export const contents = pgTable("contents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  status: varchar("status", { length: 50 }).default("draft").notNull(), // draft, published
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 媒体表
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: text("url").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  size: integer("size").notNull(),
  uploadedById: integer("uploaded_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  contents: many(contents),
  media: many(media),
}));

export const contentsRelations = relations(contents, ({ one }) => ({
  author: one(users, {
    fields: [contents.authorId],
    references: [users.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [media.uploadedById],
    references: [users.id],
  }),
}));
