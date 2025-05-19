import { router } from "../trpc";
import { authRouter } from "./auth";
import { contentRouter } from "./content";
import { mediaRouter } from "./media";
import { userRouter } from "./user";

export const appRouter = router({
  auth: authRouter,
  content: contentRouter,
  media: mediaRouter,
  user: userRouter,
});

// 导出路由类型
export type AppRouter = typeof appRouter;
