import { chromium } from "playwright";
import * as readline from "readline";
import { saveUsernamesToDB } from "./src/db/database";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

await page.goto("https://x.com/home");

// login
const username = process.env.TWITTER_USERNAME || "";
const password = process.env.TWITTER_PASSWORD || "";

await page.fill('input[autocomplete="username"]', username);
await page.click("//button//span[text()='下一步']");
await page.waitForTimeout(2000);

await page.fill('input[autocomplete="current-password"]', password);
await page.click("//button//span[text()='登录']");
await page.waitForTimeout(2000);

// 动态加载抓取函数
async function loadScrapeFunctions() {
  try {
    // 使用时间戳破坏缓存
    const timestamp = Date.now();
    const module = await import(`./src/lib/scrape-function.ts?t=${timestamp}`);

    return module;
  } catch (error) {
    console.error("❌ 加载抓取函数失败:", error);
    return null;
  }
}

// 在主循环中使用
async function mainLoop() {
  let scrapeFunctions = await loadScrapeFunctions();
  console.log(scrapeFunctions);

  while (true) {
    console.log("\n🎯 选择操作:");
    console.log("1. 抓取关注列表");
    console.log("2. 重新加载函数");
    console.log("3. 运行测试函数");
    console.log("0. 退出");

    const choice = await ask("请输入选项: ");

    try {
      switch (choice) {
        case "1":
          if (scrapeFunctions) {
            const username = await ask("输入用户名: ");
            const followingUserNames =
              await scrapeFunctions.scrapeFollowingListOptimized(
                username,
                page
              );
            await saveUsernamesToDB(followingUserNames);
          }
          break;

        case "2":
          console.log("🔄 重新加载抓取函数...");
          scrapeFunctions = await loadScrapeFunctions();
          console.log("✅ 函数已重新加载");
          console.log(scrapeFunctions);
          break;

        case "3":
          console.log("🔄 重新加载抓取函数...");
          scrapeFunctions = await loadScrapeFunctions();
          console.log("✅ 函数已重新加载");
          console.log("🧑‍💼 执行测试函数...");
          await scrapeFunctions.testFn(page);
          break;

        case "0":
          await browser.close();
          return;
      }
    } catch (error) {
      console.error("❌ 发生错误:", error);
    }
  }
}

mainLoop();
