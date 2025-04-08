import "./Layout.css";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = () => {
    const { user, logout } = useAuth();
    return <>
        <header>
            <Link to="/">Home</Link>
            { user ? <>
                <Link to="/profile" className="user">{user.utorid}</Link>
                <a href="#" onClick={logout}>Logout</a>
                </> :
                <Link to="/login">Login</Link>
            }
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
