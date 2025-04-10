import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
    const [utorid, setUtorId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { authReady, user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (user) {
        if (location.state?.fromPage) {
            const url = `${location.state.fromPage.pathname}${location.state.fromPage.search}`;
            return <Navigate to={url} replace />;
        }
        else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    const handleSubmit = async e => {
        e.preventDefault();

        const message = await login(utorid, password)
        setError(message);
    };

    return <>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="utorid">UTORid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="utorid"
                value={utorid}
                onChange={e => setUtorId(e.target.value)}
                required
            />
            <label htmlFor="password">Password:</label>
            <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <div className="btn-container">
                <button type="button" id="request" onClick={() => navigate("/reset")}>Reset Password</button>
                <button type="submit">Login</button>
            </div>
        </form>

        <p className="error">{error}</p>
    </>;
};

export default Login;
