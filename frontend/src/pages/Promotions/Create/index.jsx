import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Create = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState({
        name: null,
        description: null,
        type: "automatic",
        startTime: null,
        endTime: null,
        minSpending: null,
        rate: null,
        points: null
    });
    const { authReady, user } = useAuth();
    const navigate = useNavigate();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }
    else if (user.role === "regular" || user.role === "cashier") {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        if (value === "") {
            setData((prevData) => ({
                ...prevData,
                [name]: null,
            }));
        }
        else {
            setData({ ...data, [name]: value });
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/promotions`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`,
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                navigate("/promotions");
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while creating promotion");
        }
    };

    return <>
        <h2>Create Promotion</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={data.name || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="description">Description:</label>
            <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={data.description || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="type">Type:</label>
            <select
                id="type"
                name="type"
                value={data.type || ""}
                onChange={handleChange}
                required
            >
                <option value="automatic">Automatic</option>
                <option value="one-time">One-Time</option>
            </select>
            <label htmlFor="startTime">Start Time:</label>
            <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={data.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="endTime">End Time:</label>
            <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={data.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="minSpending">Minimum Spending:</label>
            <input
                type="number"
                id="minSpending"
                name="minSpending"
                placeholder="0"
                value={data.minSpending || ""}
                onChange={handleChange}
            />
            <label htmlFor="rate">Rate:</label>
            <input
                type="number"
                id="rate"
                name="rate"
                placeholder="0"
                value={data.rate || ""}
                onChange={handleChange}
            />
            <label htmlFor="points">Points:</label>
            <input
                type="number"
                id="points"
                name="points"
                placeholder="0"
                value={data.points || ""}
                onChange={handleChange}
            />
            <div className="btn-container">
                <button onClick={() => navigate(`/promotions`)}>Back</button>
                <button type="submit">Create</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Create;
