import { type Page } from "playwright";
import TurndownService from "turndown";
import {
  saveTweetsToDB,
  saveUsernamesToDB,
  saveUserProfileToDB,
} from "../db/database";
// 抓取帐号关注列表
export async function scrapeFollowingListOptimized(
  username: string,
  page: Page
): Promise<string[]> {
  await page.goto(`https://x.com/${username}/following`);
  await page.waitForTimeout(3000);

  const followingUsernames = new Set<string>(); //去重
  let consecutiveNoNewData = 0;
  let totalScrolls = 0;
  const maxConsecutiveNoData = 4; // 连续4次没有新数据就停止
  const maxTotalScrolls = 100;

  console.log("🚀 开始抓取虚拟列表...");

  while (
    consecutiveNoNewData < maxConsecutiveNoData &&
    totalScrolls < maxTotalScrolls
  ) {
    const beforeCount = followingUsernames.size;

    // 收集当前可见的所有用户
    await collectVisibleUsers(followingUsernames, page);

    const newUsersFound = followingUsernames.size - beforeCount;

    if (newUsersFound > 0) {
      consecutiveNoNewData = 0;
      console.log(
        `📊 第${totalScrolls + 1}次滚动: +${newUsersFound} 用户 (总计: ${
          followingUsernames.size
        })`
      );
    } else {
      consecutiveNoNewData++;
      console.log(
        `⏳ 第${
          totalScrolls + 1
        }次滚动: 未发现新用户 (${consecutiveNoNewData}/${maxConsecutiveNoData})`
      );
    }

    // 智能滚动策略
    await smartVirtualScroll(totalScrolls, page);
    totalScrolls++;

    // 动态等待时间
    const waitTime = newUsersFound > 0 ? 1000 : 2000;
    await page.waitForTimeout(waitTime);
  }

  console.log(`✅ 抓取完成！共发现 ${followingUsernames.size} 个关注用户`);
  return Array.from(followingUsernames);
}
// 抓取帐号关注列表 并 保存到数据库
export async function scrapeFollowingListAndSaveToDB(
  username: string,
  page: Page
) {
  const followingUsernames = await scrapeFollowingListOptimized(username, page);
  await saveUsernamesToDB(followingUsernames);
}

// 收集当前可见的用户
async function collectVisibleUsers(
  followingUsernames: Set<string>,
  page: Page
) {
  const visibleUsers = await page.evaluate(() => {
    const usersContainer = document.querySelector(
      '[aria-label="Timeline: Following"]'
    );
    const userElements = usersContainer?.querySelectorAll(
      '[data-testid="UserCell"] a[href^="/"]:not([dir])'
    );

    const users: string[] = [];
    userElements?.forEach((element) => {
      const href = element.getAttribute("href") || "";
      const username = href.slice(1);

      // 验证是否为有效用户名
      if (
        username &&
        !username.includes("/") &&
        !username.includes("?") &&
        username.length > 0 &&
        username.length < 16
      ) {
        users.push(username);
      }
    });

    return users;
  });

  visibleUsers.forEach((username) => followingUsernames.add(username));
}

// 智能滚动策略
async function smartVirtualScroll(scrollCount: number, page: Page) {
  await page.evaluate((count) => {
    // 根据滚动次数调整滚动距离
    let scrollDistance;

    if (count < 10) {
      // 初期：小步滚动，确保不遗漏
      scrollDistance = window.innerHeight * 0.6;
    } else if (count < 30) {
      // 中期：正常滚动
      scrollDistance = window.innerHeight * 0.8;
    } else {
      // 后期：大步滚动，加快速度
      scrollDistance = window.innerHeight * 1.2;
    }

    window.scrollBy(0, scrollDistance);
  }, scrollCount);

  // 偶尔回滚一下，确保没有遗漏虚拟列表的元素
  if (scrollCount % 15 === 0 && scrollCount > 0) {
    await page.evaluate(() => {
      window.scrollBy(0, -window.innerHeight * 0.3);
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight * 0.5);
    });
  }
}
// 抓取帐号个人资料
export async function scrapeUserProfile(username: string, page: Page) {
  await page.goto(`https://x.com/${username}`);
  await page.waitForTimeout(2000);

  const res = await page.evaluate((username) => {
    const userInfo: any = {
      displayName: "", // 获取显示名称
      bio: "", // 获取个人简介
      followersCount: 0,
      followingCount: 0,
      tweets: 0,
      profileImageUrl: "",
      joinedDate: "",
      website: "",
    };

    // 获取显示名称
    const displayNameElement = document.querySelector(
      '[data-testid="UserName"] span span'
    );
    if (displayNameElement) {
      userInfo.displayName = displayNameElement.textContent?.trim();
    }

    // 获取个人简介
    const bioElement = document.querySelector(
      '[data-testid="UserDescription"]'
    );
    if (bioElement) {
      userInfo.bio = bioElement.innerHTML;
    }

    // 获取头像URL
    const avatarElement = document.querySelector(
      `[data-testid="UserAvatar-Container-${username}"] img`
    );
    if (avatarElement) {
      userInfo.profileImageUrl = avatarElement.getAttribute("src");
    }

    // 获取推文数量 (暂时无法获取)

    // 获取关注数据
    const followingElement = document.querySelector(
      'a[href$="/following"] span span'
    );
    if (followingElement) {
      userInfo.followingCount = parseMetricCount(
        followingElement.textContent?.trim() || ""
      );
    }

    const followersElement = document.querySelector(
      'a[href$="/verified_followers"] span span'
    );
    if (followersElement) {
      userInfo.followersCount = parseMetricCount(
        followersElement.textContent?.trim() || ""
      );
    }

    // 获取加入日期
    const joinDateElement = document.querySelector(
      '[data-testid="UserJoinDate"] span'
    );
    if (joinDateElement) {
      const joinText = joinDateElement.textContent?.trim();
      if (joinText) {
        // 解析 "Joined March 2009" 格式
        const match = joinText.match(/Joined\s+(.+)/);
        if (match) {
          userInfo.joinedDate = new Date(match[1] || "");
        }
      }
    }

    // 获取网站链接
    const websiteElement = document.querySelector('[data-testid="UserUrl"]');
    if (websiteElement) {
      userInfo.website =
        websiteElement.getAttribute("href") ||
        websiteElement.textContent?.trim();
    }

    // 数量转换 1.2k => 1200
    function parseMetricCount(text: string): number {
      if (!text || text === "") return 0;

      text = text.toLowerCase().replace(/,/g, "");

      if (text.includes("k")) {
        return Math.round(parseFloat(text) * 1000);
      } else if (text.includes("m")) {
        return Math.round(parseFloat(text) * 1000000);
      }

      return parseInt(text) || 0;
    }

    return userInfo;
  }, username);

  // 获取横幅图片URL
  await page.goto(`https://x.com/${username}/header_photo`);
  await page.waitForTimeout(2000);

  const bannerURL = await page.evaluate(() => {
    const bannerElement = document.querySelector(
      '[data-testid="swipe-to-dismiss"] img'
    );
    return bannerElement?.getAttribute("src");
  });

  res.profileBannerUrl = bannerURL;

  //html2markdown
  const turndownService = new TurndownService();
  res.bio = turndownService.turndown(res.bio);

  return res;
}
// 抓取帐号个人资料 并 保存到数据库
export async function scrapeUserProfileAndSaveToDB(
  usernames: string[],
  page: Page
) {
  for (const username of usernames) {
    const res = await scrapeUserProfile(username, page);
    await saveUserProfileToDB(username, res);
  }
}

// 抓取帐号推文
export async function scrapeTweets(username: string, page: Page) {
  await page.goto(`https://x.com/${username}`);

  // 等待所有目标元素加载完成
  // await page.waitForFunction(() => {
  //   const tweetElement = document.querySelector('[data-testid="tweet"]');
  //   return tweetElement !== null; // 或者其他条件
  // });

  // ✅ 使用 waitForSelector 替代
  await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

  let tweets: any[] = [];

  const maxTweets = 10; // 最多抓取10条
  let shouldStop = false;
  let totalScrolls = 0;
  const maxTotalScrolls = 20; // 最大滚动次数

  console.log("🚀 开始抓取虚拟列表...");

  while (
    !shouldStop &&
    tweets.length < maxTweets &&
    totalScrolls < maxTotalScrolls
  ) {
    const beforeCount = tweets.length;

    // 收集当前可见的推文
    await collectVisibleTweets(tweets, page);

    // if (shouldStopCrawling) {
    //   console.log("🛑 发现已存在的推文，停止抓取");
    //   shouldStop = true;
    //   break;
    // }

    const newTweetsFound = tweets.length - beforeCount;

    if (newTweetsFound > 0) {
      console.log(
        `📊 第${totalScrolls + 1}次滚动: +${newTweetsFound} 推文 (总计: ${
          tweets.length
        }/${maxTweets})`
      );
    } else {
      console.log(`⏳ 第${totalScrolls + 1}次滚动: 未发现新推文`);
    }

    // 如果已经达到目标数量，停止
    if (tweets.length >= maxTweets) {
      console.log(`✅ 已达到目标数量 ${maxTweets} 条推文`);
      // 反转推文顺序,更改下时间
      tweets = tweets.reverse().map((tweet) => {
        return {
          ...tweet,
          scrapedAt: new Date(),
        };
      });
      break;
    }

    // 智能滚动策略
    await smartVirtualScroll(totalScrolls, page);
    totalScrolls++;

    // 动态等待时间
    const waitTime = newTweetsFound > 0 ? 1000 : 2000;
    await page.waitForTimeout(waitTime);
  }

  console.log(`✅ 抓取完成！共发现 ${tweets.length} 条推文`);
  return tweets;
}

async function collectVisibleTweets(tweets: any[], page: Page) {
  // 获取可见推文元素
  const tweetLocators = page.locator('[data-testid="tweet"]');
  const tweetCount = await tweetLocators.count();

  for (let i = 0; i < tweetCount; i++) {
    let tweetElement = tweetLocators.nth(i);

    // 检查元素是否可见且存在
    const isVisible = await tweetElement.isVisible();
    if (!isVisible) {
      console.log(`⚠️  推文元素不可见，跳过索引 ${i}`);
      continue;
    }

    const tweet = await tweetElement.evaluate((element: HTMLElement) => {
      try {
        return extractTweetFromElement(element as HTMLElement);
      } catch (error) {
        console.error("提取推文数据失败:", error);
      }

      //
      function extractTweetFromElement(element: HTMLElement) {
        // 获取发布时间
        const timeElement = element.querySelector("time") as HTMLTimeElement;
        if (!timeElement) return null;

        const publishedAt = new Date(
          timeElement.getAttribute("datetime") || ""
        );

        // 获取作者用户名
        const authorLink = element.querySelector(
          '[data-testid="User-Name"] a[href^="/"]'
        ) as HTMLAnchorElement;
        const authorUsername = authorLink
          ? authorLink.getAttribute("href")?.slice(1) || ""
          : "";

        // 生成推文ID
        const tweetId = publishedAt.getTime().toString() + authorUsername;

        // 获取推文内容
        const contentElement = element.querySelector(
          '[data-testid="tweetText"]'
        );

        const content = contentElement
          ? contentElement.textContent?.trim() || ""
          : "";
        // const htmlContent = element ? element.innerHTML || "" : "";

        // 检测推文类型
        let tweetType: "original" | "retweet" | "quote" | "reply" = "original";
        let isRetweet = false;
        let isQuote = false;
        let isReply = false;
        let retweetedTweetId: string | undefined;

        // 检查是否为转推
        const retweetIndicator = element.querySelector(
          '[data-testid="socialContext"]'
        );
        if (retweetIndicator) {
          isRetweet = true;
          tweetType = "retweet";
        }

        // 检查是否为引用推文 (引用推文有2个以上的头像)
        const avatarElements = element.querySelectorAll(
          '[data-testid="Tweet-User-Avatar"]'
        );
        if (avatarElements.length > 1) {
          isQuote = true;
          tweetType = "quote";
        }

        return {
          publishedAt,
          authorUsername,
          content,
          isRetweet,
          isQuote,
          tweetId,
        };
      }
    });

    if (tweet && !tweets.find((t) => t.tweetId === tweet.tweetId)) {
      // 确保元素可见
      // await tweetElement.scrollIntoViewIfNeeded();
      // await page.waitForTimeout(1000);

      //截图
      let screenshotBuffer = await tweetElement.screenshot();

      const screenshotBase64 = screenshotBuffer.toString("base64");
      tweets.push({
        ...tweet,
        screenshot: screenshotBase64,
        screenshotFormat: "base64",
      });
    }
  }
}

async function scrapeTewwtsAndSaveToDB(usernames: string[], page: Page) {
  for (const username of usernames) {
    const tweets = await scrapeTweets(username, page);
    await saveTweetsToDB(username, tweets);
  }
}

const getTodayUTC = () => {
  return new Date().toISOString().split("T")[0];
};

const getTodayUTCRange = () => {
  const today = getTodayUTC();
  return {
    start: `${today}T00:00:00.000Z`,
    end: `${today}T23:59:59.999Z`,
  };
};

export async function testFn(page: Page) {
  console.log("testFn");
}
