// 添加打印DOM的函数
export async function printPageDOM(page: any) {
  try {
    // 获取页面HTML
    const html = await page.content();

    // 获取所有元素的选择器信息
    const elements = await page.evaluate(() => {
      const allElements = document.querySelectorAll("input");
      const elementInfo = [];

      allElements.forEach((el, index) => {
        if (index < 100) {
          // 限制前100个元素，避免输出过多
          const info = {
            tagName: el.tagName,
            id: el.id || "",
            className: el.className || "",
            textContent: el.textContent?.substring(0, 50) || "", // 截取前50个字符
            attributes: Array.from(el.attributes)
              .map((attr) => `${attr.name}="${attr.value}"`)
              .join(" "),
          };
          elementInfo.push(info);
        }
      });

      return elementInfo;
    });

    console.log("\n🎯 页面元素摘要 (前100个元素):");
    console.log("-".repeat(80));
    elements.forEach((el, index) => {
      console.log(`${index + 1}. <${el.tagName.toLowerCase()}>`);
      if (el.id) console.log(`   ID: ${el.id}`);
      if (el.className) console.log(`   Class: ${el.className}`);
      if (el.textContent) console.log(`   Text: ${el.textContent}`);
      if (el.attributes) console.log(`   Attrs: ${el.attributes}`);
      console.log("");
    });

    console.log("elements", elements);
  } catch (error) {
    console.error("❌ 打印DOM时发生错误:", error);
  }
}
