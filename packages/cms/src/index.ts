import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./routers";
import { createContext } from "./trpc";

const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: (req, res, next) => {
    // 设置 CORS 头
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // 处理预检请求
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  },
});
server.listen(3000);
