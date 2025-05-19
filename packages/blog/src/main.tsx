import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@radix-ui/themes/styles.css";

import { createBrowserInspector } from "@statelyai/inspect";

// 只在开发环境下创建 inspector
const isDev = process.env.NODE_ENV === "development";
let inspector: ReturnType<typeof createBrowserInspector> | undefined;

if (isDev) {
  if (typeof window !== "undefined") {
    window.inspector = createBrowserInspector();
  }
}

createRoot(document.getElementById("root")!).render(<App />);
