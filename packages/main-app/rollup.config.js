import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import copy from "rollup-plugin-copy";
import dotenv from "dotenv";

const dev = process.env.NODE_ENV === "development";

const envFile = dev ? ".env" : ".env.production";

dotenv.config({ path: envFile });

console.log(
  "process.env.VUE_APP_URL",
  process.env.VUE_APP_URL,
  process.env.NODE_ENV
);

export default {
  input: "src/index.js",
  output: {
    dir: "dist",
    format: "es",
    sourcemap: true,
    inlineDynamicImports: true, // 禁用代码分割，内联所有动态导入
  },
  plugins: [
    resolve({
      browser: true,
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(
        dev ? "development" : "production"
      ),
      "process.env.VUE_APP_URL": JSON.stringify(process.env.VUE_APP_URL),
      "process.env.REACT_APP_URL": JSON.stringify(process.env.REACT_APP_URL),
      preventAssignment: true,
    }),
    copy({
      targets: [{ src: "public/*", dest: "dist/" }],
    }),
    // dev &&
    //   serve({
    //     open: true,
    //     contentBase: ["dist", "public", "../../vue-app/dist"],
    //     port: 3000,
    //   }),
    // dev && livereload("dist"),
  ],
};
