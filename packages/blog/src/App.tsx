import { Button } from "@/components/ui/button";
import { Login } from "./components/Login";
import { Header } from "./components/Header";

function App() {
  return (
    <div className="flex h-svh flex-col">
      <div className="">
        <Header />
      </div>
      <div className="flex-1">
        <Login />
      </div>
    </div>
  );
}

export default App;
