import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const anthropic = createOpenAI({
  // custom settings
  baseURL: "https://chat.cloudapi.vip/v1",
});

// 获取目录下所有 .srt 文件
function getAllSrtFiles(dirPath) {
  try {
    const files = readdirSync(dirPath);
    const srtFiles = files
      .filter((file) => extname(file).toLowerCase() === ".srt")
      .map((file) => join(dirPath, file));

    console.log(`找到 ${srtFiles.length} 个 .srt 文件:`);
    srtFiles.forEach((file) => console.log(`  - ${file}`));

    return srtFiles;
  } catch (error) {
    console.error(`读取目录失败: ${error.message}`);
    process.exit(1);
  }
}

// 读取 SRT 文件
function readSrtFile(filePath) {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    process.exit(1);
  }
}

// 调用 ChatGPT API 进行翻译
async function translateWithChatGPT(content) {
  //   return content;
  const { text } = await generateText({
    model: anthropic("grok-2"),
    prompt: "请将以下英文翻译成中文。" + content,
  });

  return text;
}

// 保存翻译后的文件
function saveSrtFile(content, outputPath) {
  try {
    writeFileSync(outputPath, content, "utf-8");
    console.log(`翻译完成，已保存到: ${outputPath}`);
  } catch (error) {
    console.error(`保存文件失败: ${error.message}`);
    process.exit(1);
  }
}

// 翻译单个文件
async function translateSingleFile(inputPath, outputDir) {
  const fileName = basename(inputPath, ".srt");
  const outputPath = join(outputDir, `${fileName}_zh.srt`);

  console.log(`\n开始翻译: ${inputPath}`);

  // 读取文件
  const content = readSrtFile(inputPath);

  // 按每三行分割内容
  const lines = content.split("\n");
  let translatedContent = "";
  console.log(`总共 ${Math.ceil(lines.length / 4)} 行，将按每 4 行分组处理...`);

  for (let i = 0; i < lines.length; i += 4) {
    const chunk = lines.slice(i, i + 4);

    if (!chunk[2]) {
      continue;
    }

    console.log(
      `翻译第 ${Math.floor(i / 4) + 1} 组 (行 ${i + 1}-${Math.min(
        i + 4,
        lines.length
      )})...`,
      chunk[2]
    );

    try {
      const translatedChunk = await translateWithChatGPT(chunk[2]);
      chunk[2] = translatedChunk;
      translatedContent += chunk.join("\n");

      // 如果不是最后一组，添加换行符
      if (i + 4 < lines.length) {
        translatedContent += "\n";
      }
    } catch (error) {
      console.error(`翻译第 ${Math.floor(i / 3) + 1} 组失败: ${error.message}`);
      // 如果翻译失败，保留原文
      translatedContent += chunk;
      if (i + 4 < lines.length) {
        translatedContent += "\n";
      }
    }
  }

  // 保存翻译结果
  saveSrtFile(translatedContent, outputPath);
}

// 主函数
async function main() {
  // 检查命令行参数
  if (process.argv.length < 3) {
    console.log("用法: bun translate-srt.js <目录路径> [输出目录路径]");
    console.log("示例: bun translate-srt.js ./videos ./translated");
    process.exit(1);
  }

  const inputDir = process.argv[2];
  const outputDir = process.argv[3] || inputDir;

  // 检查输入目录是否存在
  try {
    const stat = statSync(inputDir);
    if (!stat.isDirectory()) {
      console.error(`错误: ${inputDir} 不是一个目录`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`错误: 无法访问目录 ${inputDir}`);
    process.exit(1);
  }

  // 获取所有 .srt 文件
  const srtFiles = getAllSrtFiles(inputDir);

  console.log(srtFiles);

  if (srtFiles.length === 0) {
    console.log("没有找到任何 .srt 文件");
    return;
  }

  // 逐个翻译文件
  //srtFiles.length
  for (let i = 0; i < srtFiles.length; i++) {
    const file = srtFiles[i];
    console.log(`\n[${i + 1}/${srtFiles.length}] 处理文件: ${basename(file)}`);

    try {
      await translateSingleFile(file, outputDir);
    } catch (error) {
      console.error(`翻译文件 ${file} 时出错: ${error.message}`);
      continue; // 继续处理下一个文件
    }
  }

  // console.log(`\n所有文件处理完成！共处理了 ${srtFiles.length} 个文件。`);
}

main().catch((error) => {
  console.error(`程序执行失败: ${error.message}`);
  process.exit(1);
});

// 调用 ChatGPT API 进行翻译
// async function translateWithChatGPT2() {
//   const { text } = await generateText({
//     model: anthropic("grok-3"),
//     prompt: "你是谁？",
//   });

//   return text;
// }

// translateWithChatGPT2().then((res) => {
//   console.log(res);
// });
