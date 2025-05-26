import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { cn } from "@/lib/utils";

export function Main({ className }) {
  return (
    <div className="m flex flex-1 flex-col justify-center p-6">
      <LoginForm className="" />
    </div>
  );
}
