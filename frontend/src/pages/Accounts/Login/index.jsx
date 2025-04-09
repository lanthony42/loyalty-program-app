import "@/pages/form.css";
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const [utorid, setUtorId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { authReady, user, login } = useAuth();
    
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (user) {
        return <Navigate to="/dashboard" replace />;
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
                onChange={(e) => setUtorId(e.target.value)}
                required
            />
            <label htmlFor="password">Password:</label>
            <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <div className="btn-container">
                <button type="submit">Login</button>
                <button type="button" id="request" onClick={() => navigate(`/reset`)}>Reset Password</button>
            </div>
        </form>

        <p className="error">{error}</p>
    </>;
};

export default Login;
