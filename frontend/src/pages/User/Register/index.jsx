import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Register = () => {
    const { authReady, token, user } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) { // TODO: Change, cashiers and higher register users
        return <Navigate to="/login" replace />;
    }

    const [error, setError] = useState("");
    const [data, setData] = useState({
        utorid: "",
        name: "",
        email: ""
    });
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
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
        <h2>Registration</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="utorid">utorid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="utorid"
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
                <button type="submit">Register</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Register;
