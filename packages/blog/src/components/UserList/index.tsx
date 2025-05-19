import { useAuthStore } from "../../stores/authStore";
import Login from "../Login";
export default function UserList() {
  const { user } = useAuthStore();
  if (!user) return <Login />;
  return <div>UserList</div>;
}
