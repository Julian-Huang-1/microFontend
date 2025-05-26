import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// @ts-expect-error: 库没有类型定义，但代码实际可以工作
import { isEqual } from "@ngard/tiny-isequal";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDeepEqual(a: unknown, b: unknown): boolean {
  return isEqual(a, b);
}
