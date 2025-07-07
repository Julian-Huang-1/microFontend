import { chromium, type Browser, type Page } from "playwright";

interface TweetData {
  id: string;
  content: string;
  author: {
    username: string;
    displayName: string;
    verified: boolean;
    profileImageUrl?: string;
  };
  publishedAt: Date;
  stats: {
    retweets: number;
    likes: number;
    replies: number;
  };
  mediaUrls: string[];
  isRetweet: boolean;
  retweetedTweetId?: string;
}

interface UserData {
  username: string;
  displayName: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  verified: boolean;
  profileImageUrl?: string;
}

export class TwitterScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await chromium.launch({
      headless: false, // 设为true以无头模式运行
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
      ],
    });

    this.page = await this.browser.newPage();

    // 设置用户代理
    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // 设置视口
    await this.page.setViewportSize({ width: 1200, height: 800 });
  }

  async login(username: string, password: string) {
    if (!this.page) throw new Error("Scraper not initialized");

    await this.page.goto("https://twitter.com/login");
    await this.page.waitForTimeout(2000);

    // 输入用户名
    await this.page.fill('input[name="text"]', username);
    await this.page.click('button:has-text("Next")');
    await this.page.waitForTimeout(2000);

    // 输入密码
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button:has-text("Log in")');
    await this.page.waitForTimeout(3000);

    console.log("Logged in successfully");
  }

  async scrapeUserProfile(username: string): Promise<UserData> {
    if (!this.page) throw new Error("Scraper not initialized");

    await this.page.goto(`https://twitter.com/${username}`);
    await this.page.waitForTimeout(3000);

    // 等待用户信息加载
    await this.page.waitForSelector('[data-testid="UserName"]', {
      timeout: 10000,
    });

    const userData: UserData = await this.page.evaluate(() => {
      const displayNameElement = document.querySelector(
        '[data-testid="UserName"] span'
      );
      const bioElement = document.querySelector(
        '[data-testid="UserDescription"] span'
      );
      const statsElements = document.querySelectorAll(
        'a[href*="/following"], a[href*="/verified_followers"]'
      );
      const profileImageElement = document.querySelector(
        '[data-testid="UserAvatar"] img'
      );

      const displayName = displayNameElement?.textContent?.trim() || "";
      const bio = bioElement?.textContent?.trim() || "";
      const profileImageUrl = profileImageElement?.getAttribute("src") || "";

      // 解析统计数据
      let followingCount = 0;
      let followersCount = 0;
      let tweetCount = 0;

      statsElements.forEach((element) => {
        const href = element.getAttribute("href") || "";
        const text = element.textContent || "";
        const countMatch = text.match(/[\d,]+/);
        const count = countMatch
          ? parseInt(countMatch[0].replace(/,/g, ""))
          : 0;

        if (href.includes("/following")) {
          followingCount = count;
        } else if (href.includes("/followers")) {
          followersCount = count;
        }
      });

      // 获取推文数量
      const tweetCountElement = document.querySelector(
        'div[dir="ltr"] span:contains("posts")'
      );
      if (tweetCountElement) {
        const tweetText = tweetCountElement.textContent || "";
        const tweetMatch = tweetText.match(/[\d,]+/);
        tweetCount = tweetMatch ? parseInt(tweetMatch[0].replace(/,/g, "")) : 0;
      }

      const verified =
        document.querySelector('[data-testid="icon-verified"]') !== null;

      return {
        username: window.location.pathname.slice(1),
        displayName,
        bio,
        followersCount,
        followingCount,
        tweetCount,
        verified,
        profileImageUrl,
      };
    });

    return userData;
  }

  async scrapeFollowingList(username: string): Promise<string[]> {
    if (!this.page) throw new Error("Scraper not initialized");

    await this.page.goto(`https://twitter.com/${username}/following`);
    await this.page.waitForTimeout(3000);

    const followingUsernames: string[] = [];
    let lastHeight = 0;
    let stableCount = 0;

    while (stableCount < 3) {
      // 滚动到底部
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.page.waitForTimeout(2000);

      // 获取当前用户名列表
      const currentUsernames = await this.page.evaluate(() => {
        const userElements = document.querySelectorAll(
          '[data-testid="UserCell"] a[href^="/"]'
        );
        return Array.from(userElements).map((element) => {
          const href = element.getAttribute("href") || "";
          return href.slice(1); // 移除开头的 '/'
        });
      });

      // 添加新用户名
      currentUsernames.forEach((username) => {
        if (!followingUsernames.includes(username)) {
          followingUsernames.push(username);
        }
      });

      // 检查是否还在加载新内容
      const currentHeight = await this.page.evaluate(
        () => document.body.scrollHeight
      );
      if (currentHeight === lastHeight) {
        stableCount++;
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }

      console.log(
        `Scraped ${followingUsernames.length} following users so far...`
      );
    }

    console.log(`Found ${followingUsernames.length} following users`);
    return followingUsernames;
  }

  async scrapeTweets(
    username: string,
    maxTweets: number = 50
  ): Promise<TweetData[]> {
    if (!this.page) throw new Error("Scraper not initialized");

    await this.page.goto(`https://twitter.com/${username}`);
    await this.page.waitForTimeout(3000);

    const tweets: TweetData[] = [];
    let lastHeight = 0;
    let stableCount = 0;

    while (tweets.length < maxTweets && stableCount < 3) {
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await this.page.waitForTimeout(2000);

      const currentTweets = await this.page.evaluate(() => {
        const tweetElements = document.querySelectorAll(
          '[data-testid="tweet"]'
        );
        const tweets: any[] = [];

        tweetElements.forEach((tweetElement) => {
          try {
            const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
            const tweetId = tweetLink
              ?.getAttribute("href")
              ?.match(/\/status\/(\d+)/)?.[1];

            if (!tweetId) return;

            const contentElement = tweetElement.querySelector(
              '[data-testid="tweetText"]'
            );
            const content = contentElement?.textContent?.trim() || "";

            const authorElement = tweetElement.querySelector(
              '[data-testid="User-Name"] a'
            );
            const authorUsername =
              authorElement?.getAttribute("href")?.slice(1) || "";
            const displayNameElement = tweetElement.querySelector(
              '[data-testid="User-Name"] span'
            );
            const displayName = displayNameElement?.textContent?.trim() || "";

            const timeElement = tweetElement.querySelector("time");
            const publishedAt = timeElement?.getAttribute("datetime");

            // 获取统计数据
            const replyElement = tweetElement.querySelector(
              '[data-testid="reply"]'
            );
            const retweetElement = tweetElement.querySelector(
              '[data-testid="retweet"]'
            );
            const likeElement = tweetElement.querySelector(
              '[data-testid="like"]'
            );

            const replyCount = parseInt(
              replyElement?.textContent?.trim() || "0"
            );
            const retweetCount = parseInt(
              retweetElement?.textContent?.trim() || "0"
            );
            const likeCount = parseInt(likeElement?.textContent?.trim() || "0");

            // 检查媒体
            const mediaElements = tweetElement.querySelectorAll(
              '[data-testid="tweetPhoto"] img, [data-testid="videoPlayer"]'
            );
            const mediaUrls = Array.from(mediaElements)
              .map((element) => {
                if (element.tagName === "IMG") {
                  return element.getAttribute("src") || "";
                }
                return ""; // 视频处理需要更复杂的逻辑
              })
              .filter((url) => url);

            const verified =
              tweetElement.querySelector('[data-testid="icon-verified"]') !==
              null;
            const isRetweet =
              tweetElement
                .querySelector('[data-testid="socialContext"]')
                ?.textContent?.includes("retweeted") || false;

            tweets.push({
              id: tweetId,
              content,
              author: {
                username: authorUsername,
                displayName,
                verified,
                profileImageUrl: "",
              },
              publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
              stats: {
                retweets: retweetCount,
                likes: likeCount,
                replies: replyCount,
              },
              mediaUrls,
              isRetweet,
              retweetedTweetId: isRetweet ? tweetId : undefined,
            });
          } catch (error) {
            console.error("Error parsing tweet:", error);
          }
        });

        return tweets;
      });

      // 添加新推文
      currentTweets.forEach((tweet) => {
        if (!tweets.find((t) => t.id === tweet.id)) {
          tweets.push(tweet);
        }
      });

      const currentHeight = await this.page.evaluate(
        () => document.body.scrollHeight
      );
      if (currentHeight === lastHeight) {
        stableCount++;
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }

      console.log(`Scraped ${tweets.length} tweets so far...`);
    }

    return tweets.slice(0, maxTweets);
  }

  // async saveUserToDatabase(userData: UserData): Promise<string> {
  //   try {
  //     // 检查用户是否已存在
  //     const existingUser = await db
  //       .select()
  //       .from(users)
  //       .where(eq(users.username, userData.username));

  //     if (existingUser.length > 0) {
  //       // 更新现有用户
  //       await db
  //         .update(users)
  //         .set({
  //           displayName: userData.displayName,
  //           bio: userData.bio,
  //           followersCount: userData.followersCount,
  //           followingCount: userData.followingCount,
  //           tweetCount: userData.tweetCount,
  //           verified: userData.verified,
  //           profileImageUrl: userData.profileImageUrl,
  //           updatedAt: new Date(),
  //         })
  //         .where(eq(users.username, userData.username));

  //       return existingUser[0].id;
  //     } else {
  //       // 创建新用户
  //       const newUser = await db.insert(users).values(userData).returning();
  //       return newUser[0].id;
  //     }
  //   } catch (error) {
  //     console.error("Error saving user to database:", error);
  //     throw error;
  //   }
  // }

  // async saveTweetToDatabase(
  //   tweetData: TweetData,
  //   authorId: string
  // ): Promise<void> {
  //   try {
  //     // 检查推文是否已存在
  //     const existingTweet = await db
  //       .select()
  //       .from(tweets)
  //       .where(eq(tweets.tweetId, tweetData.id));

  //     if (existingTweet.length === 0) {
  //       await db.insert(tweets).values({
  //         tweetId: tweetData.id,
  //         authorId,
  //         content: tweetData.content,
  //         mediaUrls: JSON.stringify(tweetData.mediaUrls),
  //         retweetCount: tweetData.stats.retweets,
  //         likeCount: tweetData.stats.likes,
  //         replyCount: tweetData.stats.replies,
  //         isRetweet: tweetData.isRetweet,
  //         retweetedTweetId: tweetData.retweetedTweetId,
  //         publishedAt: tweetData.publishedAt,
  //       });
  //     } else {
  //       // 更新现有推文的统计数据
  //       await db
  //         .update(tweets)
  //         .set({
  //           retweetCount: tweetData.stats.retweets,
  //           likeCount: tweetData.stats.likes,
  //           replyCount: tweetData.stats.replies,
  //           updatedAt: new Date(),
  //         })
  //         .where(eq(tweets.tweetId, tweetData.id));
  //     }
  //   } catch (error) {
  //     console.error("Error saving tweet to database:", error);
  //     throw error;
  //   }
  // }

  // async saveFollowRelationship(
  //   followerId: string,
  //   followingId: string
  // ): Promise<void> {
  //   try {
  //     // 检查关注关系是否已存在
  //     const existingFollow = await db
  //       .select()
  //       .from(follows)
  //       .where(
  //         and(
  //           eq(follows.followerId, followerId),
  //           eq(follows.followingId, followingId)
  //         )
  //       );

  //     if (existingFollow.length === 0) {
  //       await db.insert(follows).values({
  //         followerId,
  //         followingId,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error saving follow relationship:", error);
  //     throw error;
  //   }
  // }

  async close() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}
