import "@/components/Layout.css";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import AvatarDropdown from "@/components/AvatarDropdown";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const Layout = () => {
    const { user, logout, Role, setRole } = useAuth();
    const avatarUrl = user?.avatarUrl ? `${config.backendUrl}${user?.avatarUrl}` : DEFAULT_AVATAR;

    return <>
        <header>
            <Link to="/">Home</Link>
            {user ? (
                <AvatarDropdown
                    avatarUrl={avatarUrl}
                    logout={logout}
                    user={user}
                    setRole={setRole}
                    Role={Role}
                />
                ) : (
                <Link to="/login">Login</Link>
            )}
        </header>
        <main>
            <Outlet />
        </main>
        <footer>
            &copy; Anthony Louie, Vincent Louie 2025
        </footer>
    </>;
};

export default Layout;
