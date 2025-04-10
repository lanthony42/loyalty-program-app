import "./Layout.css";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import AvatarDropdown from "@/components/AvatarDropdown";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const Layout = () => {
    const [open, setOpen] = useState(false);
    const { user, logout, Role, setRole } = useAuth();
    const avatarUrl = user?.avatarUrl ? `${config.backendUrl}${user?.avatarUrl}` : DEFAULT_AVATAR;

    return <>
        <header className={user ? "user" : ""}>
            <button className="menu-toggle" onClick={() => setOpen(!open)}>
                ☰
            </button>
            <div className={`link-container ${open ? "open" : ""}`}>
                <Link to="/">Home</Link>
                {user && <>
                    {user?.role !== "regular" && user?.role !== "cashier" && <Link to="/users">Users</Link>}
                    <Link to="/transactions">Transactions</Link>
                    <Link to="/promotions">Promotions</Link>
                    <Link to="/events">Events</Link>
                </>}
            </div>
            {user ? (
                <div className="avatar-container">
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
                <Link className="login" to="/login">Login</Link>
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
