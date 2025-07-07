# twitter-scraper

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.11. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

UTC 的核心概念
UTC (Coordinated Universal Time) 是全球标准时间，无论你在世界任何地方，UTC 时间都是相同的。

```
// 无论在哪个国家运行，这个时间都是一样的
const utcNow = new Date().toISOString(); // "2023-12-15T14:30:00.000Z"
console.log('UTC时间:', utcNow); // 全世界看到的都是同一个时间


// 举例：2023年12月15日 UTC 14:30:00

// 北京时间 (UTC+8)
// 14:30 + 8小时 = 22:30 (晚上10:30)

// 纽约时间 (UTC-5, 冬令时)
// 14:30 - 5小时 = 09:30 (上午9:30)

// 伦敦时间 (UTC+0, 冬令时)
// 14:30 + 0小时 = 14:30 (下午2:30)

// 东京时间 (UTC+9)
// 14:30 + 9小时 = 23:30 (晚上11:30)
```
