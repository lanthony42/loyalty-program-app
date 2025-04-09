import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Reset = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [resetData, setResetData] = useState({
        utorid: null,
        resetToken: null,
        password: null
    });

    const { authReady, user } = useAuth();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handlePasswordResetChange = e => {
        const { name, value } = e.target;
        setResetData({ ...resetData, [name]: value });
    };

    const handleTokenRequest = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/auth/resets`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    utorid: resetData.utorid
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResetData(prev => ({
                    ...prev,
                    resetToken: data.resetToken
                }));
                setError("");
                alert(`Reset token: ${data.resetToken}`);
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while requesting token");
        }
    };

    const handlePasswordReset = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/auth/resets/${resetData.resetToken}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    utorid: resetData.utorid,
                    password: resetData.password
                }),
            });

            if (response.ok) {
                navigate("/login");
            }
            else {
                const json = await response.json();
                setPasswordError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setPasswordError("An error occurred while resetting password");
        }
    };

    return <>
        <h2>Request Reset Token</h2>
        <form onSubmit={handleTokenRequest}>
            <label htmlFor="utorid">UTORid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="utorid"
                value={resetData.utorid || ""}
                onChange={handlePasswordResetChange}
                required
            />
            <div className="btn-container">
                <button type="submit">Request</button>
            </div>
            <p className="error">{error}</p>
        </form>

        <h2>Reset Password</h2>
        <form onSubmit={handlePasswordReset}>
            <label htmlFor="resetToken">Reset Token:</label>
            <input
                type="text"
                id="resetToken"
                name="resetToken"
                value={resetData.resetToken || ""}
                required
                onChange={handlePasswordResetChange}
            />
            <label htmlFor="password">New Password:</label>
            <input
                type="password"
                id="password"
                name="password"
                value={resetData.password || ""}
                required
                onChange={handlePasswordResetChange}
            />
            <div className="btn-container">
                <button id="update">Update Password</button>
            </div>
            <p className="error">{passwordError}</p>
        </form>
    </>;
};

export default Reset;
