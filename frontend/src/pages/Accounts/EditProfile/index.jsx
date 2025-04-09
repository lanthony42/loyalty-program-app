import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const UpdateUser = () => {
    const { authReady, user, fetchUserData } = useAuth();
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [data, setData] = useState({
        name: user?.name || null,
        email: user?.email || null,
        birthday: user?.birthday || null,
        avatar: null
    });
    const [passwordData, setPasswordData] = useState({
        old: null,
        new: null,
    });
    const navigate = useNavigate();
    const avatarUrl = user?.avatarUrl ? `${config.backendUrl}${user?.avatarUrl}` : DEFAULT_AVATAR;

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handlePasswordChange = e => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };


    const handleFileChange = e => {
        const file = e.target.files[0];
        if (file) {
            setData({ ...data, avatar: file });
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users/me`;
            const formData = new FormData();
            for (const key in data) {
                if (data[key]) {
                    formData.append(key, data[key]);
                }
            }
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
                body: formData,
            });

            if (response.ok) {
                await fetchUserData(user.token);
                navigate("/dashboard");
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while updating");
        }
    };

    const handlePasswordUpdate = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users/me/password`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    old: passwordData.old,
                    new: passwordData.new
                }),
            });

            if (response.ok) {
                await fetchUserData(user.token);
                navigate("/dashboard");
            } else {
                const json = await response.json();
                setPasswordError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setPasswordError("An error occurred while requesting token");
        }
    };

    return <>
        <h3>Hello, {user?.name || user?.utorid}!</h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", fontWeight: "bold" }}>
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
            <p>User ID: {user?.id}</p>
        </div>


        <h2>Update Your Information</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={data.name || ""}
                onChange={handleChange}
            />
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={data.email || ""}
                onChange={handleChange}
            />
            <label htmlFor="birthday">Birthday:</label>
            <input
                type="date"
                id="birthday"
                name="birthday"
                placeholder="Birthday"
                value={data.birthday || ""}
                onChange={handleChange}
            />
            <label htmlFor="avatar">Avatar:</label>
            <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleFileChange}
            />
            <div className="btn-container">
                <button type="submit">Update</button>
            </div>
            <p className="error">{error}</p>
        </form>

        <h2>Update Password</h2>
        <form onSubmit={handlePasswordUpdate}>
            <label htmlFor="old">Old Password:</label>
            <input
                type="password"
                id="old"
                name="old"
                value={passwordData.old || ""}
                required
                onChange={handlePasswordChange}
            />
            <label htmlFor="new">New Password:</label>
            <input
                type="password"
                id="new"
                name="new"
                value={passwordData.new || ""}
                required
                onChange={handlePasswordChange}
            />
            <div className="btn-container">
                <button id="update">Update Password</button>
            </div>
        </form>
        <p className="error">{passwordError}</p>
    </>;
};

export default UpdateUser;
