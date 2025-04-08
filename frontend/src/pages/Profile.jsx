import "./main.css";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const Profile = () => {
    const { user, logout } = useAuth();
    const date = new Date(user?.createdAt);
    const options = { hour: "numeric", minute: "numeric", hour12: true };
    const pretty_date = date.toLocaleTimeString("en-US", options);

    const avatarUrl = user?.avatarUrl ? `${BACKEND_URL}${user?.avatarUrl}` : DEFAULT_AVATAR;
    
    return <>
        <h3>Hello, {user?.utorid} !</h3>
        <p>You have been with us since {pretty_date}.</p>
        <img
            src={avatarUrl}
            alt="Your avatar"
            style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "1rem"
            }}
        />

        <div className="row">
            <Link to="/updateUser">Update Information</Link>
            <a href="#" onClick={logout}>Logout</a>
        </div>
    </>;
};

export default Profile;
