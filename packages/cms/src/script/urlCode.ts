import { bodyLimit } from "hono/body-limit";

/**
 * 将JavaScript对象编码为URL安全的JSON字符串
 * @param {Object} obj - 要编码的JavaScript对象
 * @returns {string} URL编码后的JSON字符串
 */
function encodeObjectForUrl(obj) {
  // 将对象转换为JSON字符串
  const jsonString = JSON.stringify(obj);

  // 对JSON字符串进行URL编码
  const encodedJson = encodeURIComponent(jsonString);

  return encodedJson;
}

// 使用示例
const params = {
  limit: 20,
  offset: 0,
};

const encodedParams = encodeObjectForUrl(params);
console.log(encodedParams);
// 输出: %7B%22limit%22%3A20%2C%22offset%22%3A0%2C%22status%22%3A%22published%22%7D

// 在URL中使用
const url = `http://localhost:3000/content.list?input=${encodedParams}`;
console.log(url);
// 完整URL示例
