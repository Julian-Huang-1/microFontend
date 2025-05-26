import { Main } from "./Main";
import { Slider } from "./Slider";

export function Login() {
  return (
    <div className="flex h-full">
      <Main className="flex-1 md:flex-1 lg:flex-1" />
      <Slider className="w-0 md:flex-1 lg:flex-2 xl:flex-3" />
    </div>
  );
}
