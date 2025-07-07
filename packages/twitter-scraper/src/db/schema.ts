import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
  index,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

// 用户表 - 存储Twitter用户信息
export const usersTable = pgTable(
  "twitter_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    twitterId: varchar("twitter_id", { length: 50 }).notNull().unique(), // Twitter用户ID
    username: varchar("username", { length: 255 }).notNull().unique(), // @username
    displayName: varchar("display_name", { length: 255 }), // 显示名称
    bio: text("bio"), // 个人简介
    location: varchar("location", { length: 255 }), // 位置信息
    website: varchar("website", { length: 500 }), // 个人网站
    followersCount: integer("followers_count").default(0), // 关注者数量
    followingCount: integer("following_count").default(0), // 关注数量
    tweetCount: integer("tweet_count").default(0), // 推文数量
    listedCount: integer("listed_count").default(0), // 被列表数量
    verified: boolean("verified").default(false), // 是否认证
    verifiedType: varchar("verified_type", { length: 50 }), // 认证类型 (blue, government, business)
    profileImageUrl: text("profile_image_url"), // 头像URL
    profileBannerUrl: text("profile_banner_url"), // 横幅URL
    joinedDate: timestamp("joined_date"), // 加入Twitter日期
    isPrivate: boolean("is_private").default(false), // 是否私人账户
    isActive: boolean("is_active").default(true), // 账户是否活跃
    lastScrapedAt: timestamp("last_scraped_at"), // 最后抓取时间
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    usernameIdx: index("twitter_users_username_idx").on(table.username),
    twitterIdIdx: index("twitter_users_twitter_id_idx").on(table.twitterId),
    lastScrapedIdx: index("twitter_users_last_scraped_idx").on(
      table.lastScrapedAt
    ),
  })
);

// 推文表 - 存储推文内容
export const tweetsTable = pgTable(
  "tweets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tweetId: varchar("tweet_id", { length: 50 }).notNull().unique(), // Twitter推文ID
    authorId: uuid("author_id")
      .references(() => usersTable.id)
      .notNull(), // 作者用户ID
    authorUsername: varchar("author_username", { length: 255 }).notNull(), // 作者用户名 (与authorId不一定映射，有可能是转推的作者)
    content: text("content").notNull(), // 推文文本内容
    htmlContent: text("html_content"), // HTML格式内容
    language: varchar("language", { length: 10 }), // 语言代码
    source: varchar("source", { length: 255 }), // 发布来源 (Twitter for iPhone等)

    // 媒体信息
    mediaData: jsonb("media_data"), // JSON格式存储媒体信息
    mediaUrls: text("media_urls").array(), // 媒体URL数组
    hasMedia: boolean("has_media").default(false), // 是否包含媒体

    // 互动数据
    retweetCount: integer("retweet_count").default(0),
    likeCount: integer("like_count").default(0),
    replyCount: integer("reply_count").default(0),
    quoteCount: integer("quote_count").default(0),
    viewCount: integer("view_count").default(0),
    bookmarkCount: integer("bookmark_count").default(0),

    // 🆕 截图引用字段（轻量级）
    hasScreenshot: boolean("has_screenshot").default(false), // 是否有截图
    screenshotCount: integer("screenshot_count").default(0), // 截图数量

    // 推文类型和关系
    tweetType: varchar("tweet_type", { length: 20 }).default("original"), // original, retweet, quote, reply
    isRetweet: boolean("is_retweet").default(false),
    isQuote: boolean("is_quote").default(false),
    isReply: boolean("is_reply").default(false),
    retweetedTweetId: varchar("retweeted_tweet_id", { length: 50 }), // 转发的原推文ID
    quotedTweetId: varchar("quoted_tweet_id", { length: 50 }), // 引用的推文ID
    inReplyToTweetId: varchar("in_reply_to_tweet_id", { length: 50 }), // 回复的推文ID
    inReplyToUserId: varchar("in_reply_to_user_id", { length: 50 }), // 回复的用户ID

    // 地理位置
    coordinates: jsonb("coordinates"), // 地理坐标 JSON
    placeId: varchar("place_id", { length: 50 }), // 地点ID
    placeName: varchar("place_name", { length: 255 }), // 地点名称

    // 标签和提及
    hashtags: text("hashtags").array(), // 话题标签数组
    mentions: jsonb("mentions"), // 提及的用户信息 JSON
    urls: jsonb("urls"), // URL信息 JSON

    // 时间信息
    publishedAt: timestamp("published_at").notNull(), // 发布时间
    editedAt: timestamp("edited_at"), // 编辑时间
    scrapedAt: timestamp("scraped_at").defaultNow(), // 抓取时间
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tweetIdIdx: index("tweets_tweet_id_idx").on(table.tweetId),
    authorIdIdx: index("tweets_author_id_idx").on(table.authorId),
    publishedAtIdx: index("tweets_published_at_idx").on(table.publishedAt),
    tweetTypeIdx: index("tweets_tweet_type_idx").on(table.tweetType),
    hashtagsIdx: index("tweets_hashtags_idx").on(table.hashtags),
    scrapedAtIdx: index("tweets_scraped_at_idx").on(table.scrapedAt),
  })
);

// 🆕 专门的截图表
export const screenshotsTable = pgTable(
  "screenshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tweetId: varchar("tweet_id", { length: 50 })
      .notNull()
      .unique()
      .references(() => tweetsTable.tweetId, { onDelete: "cascade" }), // 级联删除

    // 截图数据
    screenshot: text("screenshot").notNull(), // base64格式的截图数据
    screenshotFormat: varchar("screenshot_format", { length: 10 }).default(
      "png"
    ),
    screenshotSize: integer("screenshot_size"), // 字节大小
    screenshotHash: varchar("screenshot_hash", { length: 64 }), // SHA256哈希，用于去重

    // 截图元数据
    width: integer("width"), // 图片宽度
    height: integer("height"), // 图片高度
    quality: integer("quality"), // 图片质量（如果是JPEG）

    // 截图类型和版本
    screenshotType: varchar("screenshot_type", { length: 20 }).default("full"), // full, thumbnail, compressed
    version: integer("version").default(1), // 版本号，支持同一推文多个截图版本

    // 处理信息
    processingStatus: varchar("processing_status", { length: 20 }).default(
      "completed"
    ), // pending, completed, failed
    errorMessage: text("error_message"), // 错误信息

    // 时间信息
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tweetIdIdx: index("screenshots_tweet_id_idx").on(table.tweetId),
    hashIdx: index("screenshots_hash_idx").on(table.screenshotHash),
    typeIdx: index("screenshots_type_idx").on(table.screenshotType),
    statusIdx: index("screenshots_status_idx").on(table.processingStatus),
    createdAtIdx: index("screenshots_created_at_idx").on(table.createdAt),
    // 复合索引：根据推文ID和类型查询
    tweetTypeIdx: index("screenshots_tweet_type_idx").on(
      table.tweetId,
      table.screenshotType
    ),
  })
);

// 关注关系表
export const followsTable = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id").references(() => usersTable.id), // 关注者ID
    followingId: uuid("following_id").references(() => usersTable.id), // 被关注者ID
    followedAt: timestamp("followed_at"), // 关注时间
    isActive: boolean("is_active").default(true), // 关注关系是否有效
    scrapedAt: timestamp("scraped_at").defaultNow(), // 抓取时间
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    followerIdIdx: index("follows_follower_id_idx").on(table.followerId),
    followingIdIdx: index("follows_following_id_idx").on(table.followingId),
    uniqueFollow: index("follows_unique_idx").on(
      table.followerId,
      table.followingId
    ),
  })
);

// 抓取配置表
export const scrapeConfigsTable = pgTable(
  "scrape_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetUsername: varchar("target_username", { length: 255 }).notNull(), // 目标用户名
    targetUserId: uuid("target_user_id").references(() => usersTable.id), // 目标用户ID
    configName: varchar("config_name", { length: 255 }).notNull(), // 配置名称

    // 抓取设置
    isActive: boolean("is_active").default(true), // 是否启用
    scrapeType: varchar("scrape_type", { length: 50 }).notNull(), // timeline, following, followers, search
    scrapeInterval: integer("scrape_interval").default(3600), // 抓取间隔(秒)
    maxTweetsPerScrape: integer("max_tweets_per_scrape").default(50), // 每次抓取最大推文数
    includeReplies: boolean("include_replies").default(false), // 是否包含回复
    includeRetweets: boolean("include_retweets").default(true), // 是否包含转发

    // 过滤设置
    keywords: text("keywords").array(), // 关键词过滤
    hashtagFilter: text("hashtag_filter").array(), // 话题标签过滤
    languageFilter: varchar("language_filter", { length: 10 }), // 语言过滤
    minLikes: integer("min_likes").default(0), // 最小点赞数
    minRetweets: integer("min_retweets").default(0), // 最小转发数

    // 时间范围
    startDate: timestamp("start_date"), // 开始日期
    endDate: timestamp("end_date"), // 结束日期

    // 状态信息
    lastScrapedAt: timestamp("last_scraped_at"), // 最后抓取时间
    totalTweetsScraped: integer("total_tweets_scraped").default(0), // 总抓取推文数
    errorCount: integer("error_count").default(0), // 错误次数
    lastError: text("last_error"), // 最后错误信息

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    targetUsernameIdx: index("scrape_configs_target_username_idx").on(
      table.targetUsername
    ),
    isActiveIdx: index("scrape_configs_is_active_idx").on(table.isActive),
    scrapeTypeIdx: index("scrape_configs_scrape_type_idx").on(table.scrapeType),
  })
);

// 抓取日志表
export const scrapeLogsTable = pgTable(
  "scrape_logs",
  {
    id: serial("id").primaryKey(),
    configId: uuid("config_id").references(() => scrapeConfigsTable.id), // 关联的配置ID
    startTime: timestamp("start_time").defaultNow(), // 开始时间
    endTime: timestamp("end_time"), // 结束时间
    status: varchar("status", { length: 20 }).notNull(), // running, completed, failed
    tweetsFound: integer("tweets_found").default(0), // 发现的推文数
    tweetsStored: integer("tweets_stored").default(0), // 存储的推文数
    usersFound: integer("users_found").default(0), // 发现的用户数
    usersStored: integer("users_stored").default(0), // 存储的用户数
    errorMessage: text("error_message"), // 错误信息
    metadata: jsonb("metadata"), // 其他元数据
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    configIdIdx: index("scrape_logs_config_id_idx").on(table.configId),
    statusIdx: index("scrape_logs_status_idx").on(table.status),
    startTimeIdx: index("scrape_logs_start_time_idx").on(table.startTime),
  })
);

// 话题标签表 (用于统计和分析)
export const hashtagsTable = pgTable(
  "hashtags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tag: varchar("tag", { length: 255 }).notNull().unique(), // 话题标签 (不含#)
    normalizedTag: varchar("normalized_tag", { length: 255 }).notNull(), // 标准化后的标签
    tweetCount: integer("tweet_count").default(0), // 使用该标签的推文数
    firstSeenAt: timestamp("first_seen_at").defaultNow(), // 首次出现时间
    lastSeenAt: timestamp("last_seen_at").defaultNow(), // 最后出现时间
    isBlacklisted: boolean("is_blacklisted").default(false), // 是否被屏蔽
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    tagIdx: index("hashtags_tag_idx").on(table.tag),
    normalizedTagIdx: index("hashtags_normalized_tag_idx").on(
      table.normalizedTag
    ),
    tweetCountIdx: index("hashtags_tweet_count_idx").on(table.tweetCount),
  })
);

// 推文话题标签关联表
export const tweetHashtagsTable = pgTable(
  "tweet_hashtags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tweetId: uuid("tweet_id").references(() => tweetsTable.id), // 推文ID
    hashtagId: uuid("hashtag_id").references(() => hashtagsTable.id), // 话题标签ID
    position: integer("position"), // 在推文中的位置
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tweetIdIdx: index("tweet_hashtags_tweet_id_idx").on(table.tweetId),
    hashtagIdIdx: index("tweet_hashtags_hashtag_id_idx").on(table.hashtagId),
    uniqueTweetHashtag: index("tweet_hashtags_unique_idx").on(
      table.tweetId,
      table.hashtagId
    ),
  })
);

// 用户提及表
export const mentionsTable = pgTable(
  "mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tweetId: uuid("tweet_id").references(() => tweetsTable.id), // 推文ID
    mentionedUserId: uuid("mentioned_user_id").references(() => usersTable.id), // 被提及用户ID
    mentionedUsername: varchar("mentioned_username", { length: 255 }).notNull(), // 被提及用户名
    position: integer("position"), // 在推文中的位置
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    tweetIdIdx: index("mentions_tweet_id_idx").on(table.tweetId),
    mentionedUserIdIdx: index("mentions_mentioned_user_id_idx").on(
      table.mentionedUserId
    ),
    mentionedUsernameIdx: index("mentions_mentioned_username_idx").on(
      table.mentionedUsername
    ),
  })
);

// 导出所有表的类型
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Tweet = typeof tweetsTable.$inferSelect;
export type NewTweet = typeof tweetsTable.$inferInsert;

export type Follow = typeof followsTable.$inferSelect;
export type NewFollow = typeof followsTable.$inferInsert;

export type ScrapeConfig = typeof scrapeConfigsTable.$inferSelect;
export type NewScrapeConfig = typeof scrapeConfigsTable.$inferInsert;

export type ScrapeLog = typeof scrapeLogsTable.$inferSelect;
export type NewScrapeLog = typeof scrapeLogsTable.$inferInsert;

export type Hashtag = typeof hashtagsTable.$inferSelect;
export type NewHashtag = typeof hashtagsTable.$inferInsert;

export type TweetHashtag = typeof tweetHashtagsTable.$inferSelect;
export type NewTweetHashtag = typeof tweetHashtagsTable.$inferInsert;

export type Mention = typeof mentionsTable.$inferSelect;
export type NewMention = typeof mentionsTable.$inferInsert;
