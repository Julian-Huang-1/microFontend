import Link from "next/link";
import { SocialLink } from "./social-link";
import { Separator } from "@radix-ui/react-separator";
import GitHubIcon from "@/assets/icons/github.svg";
export function Header() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            {/* <Logo /> */}
            <span className="hidden font-bold md:block">themeGen</span>
          </Link>
        </div>
        <div className="flex items-center gap-3.5">
          <SocialLink
            href="https://github.com"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <GitHubIcon className="size-4" />
          </SocialLink>
          <Separator orientation="vertical" className="h-8" />
        </div>
      </div>
    </header>
  );
}
