import { UseAuth } from "../contexts/AuthContext";
import "./main.css";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

function Profile() {
    const { user, logout } = UseAuth();
    const date = new Date(user?.createdAt);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    const pretty_date = date.toLocaleTimeString('en-US', options);

    const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR;
    
    console.log(user?.avatarUrl);
    return <>
        <h3>Hello, {user?.utorid} !</h3>
        <p>You have been with us since {pretty_date}.</p>
        <img
            src={avatarUrl}
            alt="Your avatar"
            style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '1rem'
            }}
        />

        <div className="row">
            <a href="/updateUser">Update Information</a>
            <a href="#" onClick={logout}>Logout</a>
        </div>
    </>;
}

export default Profile;
