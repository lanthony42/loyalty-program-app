import "@/pages/main.css";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const Profile = () => {
    const { authReady, user, logout } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const date = new Date(user?.createdAt);
    const options = { hour: "numeric", minute: "numeric", hour12: true };
    const pretty_date = date.toLocaleTimeString("en-US", options);
    const avatarUrl = user?.avatarUrl ? `${config.backendUrl}${user?.avatarUrl}` : DEFAULT_AVATAR;
    
    return <>
        <h3>Hello, {user?.utorid}!</h3>
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
            <Link to="/profile/edit">Update Information</Link>
            <a href="#" onClick={logout}>Logout</a>
        </div>
    </>;
};

export default Profile;
