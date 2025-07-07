import { chromium } from "playwright";
import * as readline from "readline";
import { saveUsernamesToDB } from "./src/db/database";
import { printPageDOM } from "./src/lib/printPageDOM";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

const browser = await chromium.launch({
  headless: true,
  args: [
    "--lang=en-US",
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ],
});
const page = await browser.newPage({
  locale: "en-US",
  viewport: { width: 1920, height: 1080 }, // 设置视口大小
});

await page.goto("https://x.com/home");

// login
const username = process.env.TWITTER_USERNAME || "";
const password = process.env.TWITTER_PASSWORD || "";

await page.fill('input[autocomplete="username"]', username);
await page.click("//button//span[text()='Next']");
await page.waitForTimeout(2000);
printPageDOM(page);
const fullPagePath = `screenshots/fullpage-${Date.now()}.png`;
await page.screenshot({
  path: fullPagePath,
  fullPage: true,
});
console.log(`✅ 全页面截图已保存: ${fullPagePath}`);

await page.fill('input[autocomplete="current-password"]', password);
await page.click("//button//span[text()='Log in']");
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
