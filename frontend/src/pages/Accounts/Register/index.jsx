import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Register = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState({
        utorid: "",
        name: "",
        email: ""
    });
    const { authReady, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
    }
    else if (user.role === "regular") {
        return <Navigate to="/users" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const clickBack = () => {
        if (location.state?.fromSite) {
            navigate(-1);
        }
        else {
            navigate('/users');
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                navigate("/dashboard");
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while registering");
        }
    };

    return <>
        <h1>Registering User</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="utorid">UTORid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="UTORid"
                value={data.utorid}
                onChange={handleChange}
                required
            />
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={data.name}
                onChange={handleChange}
                required
            />
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={data.email}
                onChange={handleChange}
                required
            />
            <div className="btn-container">
                <button onClick={clickBack}>Back</button>
                <button type="submit">Register</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Register;
