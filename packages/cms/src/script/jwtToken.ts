import jwt from "jsonwebtoken";

// 生成一个已过期的测试令牌
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function generateExpiredToken(userId: string) {
  // 创建一个过去的时间点（比如10分钟前）
  const pastDate = Math.floor(Date.now() / 1000) - 600; // 10分钟前的时间戳

  // 使用 jwt.sign 的方式一：直接设置 exp 声明
  const token = jwt.sign(
    {
      id: userId,
      // 设置令牌的签发时间和过期时间都在过去
      iat: pastDate - 3600, // 签发时间在1小时前
      exp: pastDate, // 过期时间在10分钟前
    },
    JWT_SECRET
  );

  return token;
}

// 使用方式
const expiredToken = generateExpiredToken("user123");
console.log("过期的测试令牌:", expiredToken);
