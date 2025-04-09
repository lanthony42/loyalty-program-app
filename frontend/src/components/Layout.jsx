import "./Layout.css";
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
            <div className="link-container" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <Link to="/">Home</Link>
                {user?.role !== "regular" && (
                    <Link to="/users">Users</Link>
                )}
                <Link to="/transactions">Transactions</Link>
            </div>
            {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: 0, paddingRight: 50 }}>
                    <span className="user-points">{user?.points || 0} points</span>
                    <div className="avatar-dropdown">
                        <AvatarDropdown
                            avatarUrl={avatarUrl}
                            logout={logout}
                            user={user}
                            setRole={setRole}
                            Role={Role}
                        />
                    </div>
                </div>
            ) : (
                <Link style={{ paddingTop: "10px", paddingRight: "50px" }} to="/login">Login</Link>
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
