import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Create = () => {
    const { Role, authReady, user } = useAuth();
    const [event, setEvent] = useState({});
    const [error, setError] = useState("");    
    const navigate = useNavigate();
    const location = useLocation();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setEvent({
            ...event,
            [name]: value
        });
    };

    const clickBack = () => {
        if (location.state?.fromSite) {
            navigate(-1);
        }
        else {
            navigate('/events');
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        if (!event.capacity) {
            event.capacity = undefined;
        }

        try {
            const url = `${config.backendUrl}/events`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(event),
            });

            if (response.ok) {
                clickBack();
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

    return <>
        <h1>Creating Event</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={event.name || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="description">Description:</label>
            <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={event.description || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="location">Location:</label>
            <input
                type="text"
                id="location"
                name="location"
                placeholder="Location"
                value={event.location || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="startTime">Start Time:</label>
            <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                placeholder="Start Time"
                value={event.startTime || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="endTime">End Time:</label>
            <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                placeholder="End Time"
                value={event.endTime || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="capacity">Capacity:</label>
            <input
                type="number"
                id="capacity"
                name="capacity"
                placeholder="Capacity"
                min="1"
                step="1"
                value={event.capacity || ""}
                onChange={handleChange}
            />
            <label htmlFor="points">Points:</label>
            <input
                type="number"
                id="points"
                name="points"
                placeholder="Points"
                min="1"
                step="1"
                value={event.points || ""}
                onChange={handleChange}
                required
            />
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                <button type="submit">Create</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Create;
