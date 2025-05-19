import { Theme, ThemePanel } from "@radix-ui/themes";
import Login from "./components/Login";
function App() {
  return (
    <Theme>
      <Login />
      <ThemePanel />
    </Theme>
  );
}

export default App;
