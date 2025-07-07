import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { usersTable, tweetsTable, screenshotsTable } from "./schema";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
config();
import { createHash } from "crypto";

console.log(process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL!);

// 初始化时设置 UTC
await sql`SET timezone = 'UTC'`;

export const db = drizzle({ client: sql });

// 保存用户名列表到数据库
export async function saveUsernamesToDB(usernames: string[]): Promise<void> {
  console.log(`💾 开始保存 ${usernames.length} 个用户名到数据库...`);

  let savedCount = 0;
  let skippedCount = 0;

  for (const username of usernames) {
    try {
      // 检查用户是否已存在
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

      if (existingUser.length === 0) {
        // 用户不存在，插入新记录
        await db.insert(usersTable).values({
          username: username,
          twitterId: `temp_${username}_${Date.now()}`, // 临时ID，后续可以更新
          lastScrapedAt: new Date(),
        });
        savedCount++;
        console.log(`✅ 保存用户: ${username}`);
      } else {
        // 用户已存在，更新最后抓取时间
        await db
          .update(usersTable)
          .set({
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(usersTable.username, username));
        skippedCount++;
        console.log(`⏭️  用户已存在: ${username}`);
      }
    } catch (error) {
      console.error(`❌ 保存用户 ${username} 时出错:`, error);
    }
  }

  console.log(
    `✅ 数据库保存完成！新增: ${savedCount}, 已存在: ${skippedCount}`
  );
}

// 保存用户资料到数据库
export async function saveUserProfileToDB(username: string, userProfile: any) {
  console.log(`💾 开始保存用户资料到数据库...`);

  try {
    // 检查用户是否已存在
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (existingUser.length === 0) {
      // 用户不存在，插入新记录
      await db.insert(usersTable).values({
        username: username,
        ...userProfile,
        twitterId: `temp_${username}_${Date.now()}`, // 临时ID，后续可以更新
        lastScrapedAt: new Date(),
      });
      console.log(`✅ 保存新用户资料: ${username}`);
    } else {
      // 用户已存在，更新最后抓取时间
      await db
        .update(usersTable)
        .set({
          ...userProfile,
          lastScrapedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(usersTable.username, username));
      console.log(`⏭️ 更新用户资料: ${username}`);
    }
  } catch (error) {
    console.error(`❌ 保存用户 ${username} 时出错:`, error);
  }
}

// 保存单个推文到数据库
export async function saveTweetToDB(username: string, tweetData: any) {
  try {
    // 首先尝试找到作者的用户ID
    let authorId: string | null = null;

    try {
      const author = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, username))
        .limit(1);

      if (author.length > 0) {
        authorId = author[0]?.id || null;
      }
    } catch (error) {
      console.log(
        `未找到用户 ${tweetData.authorUsername} 的记录，将以 null 存储`
      );
    }
    await db
      .insert(tweetsTable)
      .values({
        ...tweetData,
        authorId: authorId,
      })
      .onConflictDoNothing(); // 避免重复插入

    console.log(`✅ 推文已保存到数据库: ${tweetData.tweetId}`);
    return true;
  } catch (error) {
    console.error(`❌ 保存推文失败: ${tweetData.tweetId}`, error);
    return false;
  }
}

// 保存截图到专门的表
export async function saveScreenshotToDB(screenshotData: any) {
  try {
    // 计算截图哈希用于去重
    const screenshotHash = createHash("sha256")
      .update(screenshotData.screenshot)
      .digest("hex");

    // 检查是否已存在相同的截图
    const existingScreenshot = await db
      .select({ id: screenshotsTable.id })
      .from(screenshotsTable)
      .where(eq(screenshotsTable.screenshotHash, screenshotHash))
      .limit(1);

    if (existingScreenshot.length > 0) {
      console.log(`⚠️ 截图已存在，跳过保存: ${screenshotData.tweetId}`);
      return existingScreenshot[0]?.id || null;
    }

    // 保存截图
    await db
      .insert(screenshotsTable)
      .values({
        ...screenshotData,
        processingStatus: "completed",
      })
      .onConflictDoNothing(); // 避免重复插入

    console.log(`✅ 截图已保存: ${screenshotData.tweetId}`);
  } catch (error) {
    console.error(`❌ 保存截图失败: ${screenshotData.tweetId}`, error);
    throw error;
  }
}

// 批量保存推文到数据库
export async function saveTweetsToDB(username: string, tweetsData: any[]) {
  let successCount = 0;
  let failCount = 0;

  for (const tweetData of tweetsData) {
    // 保存推文
    const success = await saveTweetToDB(username, tweetData);
    if (success) {
      if (tweetData.screenshot) {
        // 保存截图
        await saveScreenshotToDB({
          tweetId: tweetData.tweetId,
          screenshot: tweetData.screenshot,
          screenshotFormat: tweetData.screenshotFormat,
        });
      }
      successCount++;
    } else {
      failCount++;
    }

    // 添加小延迟避免数据库压力过大
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`📊 批量保存完成: 成功 ${successCount} 条，失败 ${failCount} 条`);
  return { successCount, failCount };
}
