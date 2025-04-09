import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const View = () => {
    const [event, setEvent] = useState(null);
    const [error, setError] = useState("");
    const { eventId } = useParams();
    const { Role, authReady, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            fetchEventData();
        }
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    const isOrganizer = isManager || event && event.organizers.some(x => x.id === user.id);
    const startPassed = event && new Date() >= new Date(event.startTime);
    const endPassed = event && new Date() >= new Date(event.endTime);

    const fetchEventData = async () => {
        try {
            const url = `${config.backendUrl}/events/${eventId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEvent({
                    ...data,
                    points: data.pointsRemain + data.pointsAwarded,
                    wasPublished: data.published
                });
            }
            else if (response.status === 404) {
                navigate("/404");
            }
            else {
                throw new Error("Failed to fetch event data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    const toDateTimeLocal = time => {
        if (!time) {
            return "";
        }

        const date = new Date(time);
        const pad = n => String(n).padStart(2, "0");

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setEvent({
            ...event,
            [name]: value
        });
    };

    const handleCheckbox = e => {
        const { name, checked } = e.target;
        setEvent({
            ...event,
            [name]: checked
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

        if (startPassed) {
            for (const key of ["name", "description", "location", "startTime", "capacity"]) {
                event[key] = undefined;
            }
        }
        if (endPassed) {
            event.endTime = undefined;
        }
        if (!event.wasPublished && !event.published) {
            event.published = undefined;
        }

        try {
            const url = `${config.backendUrl}/events/${event.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(event),
            });

            if (response.ok) {
                await fetchEventData();
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
    
    return !event ? <p>Loading...</p> : <>
        <h1>Event {event.id}</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={event.name || ""}
                onChange={handleChange}
                disabled={!isOrganizer || startPassed}
            />
            <label htmlFor="description">Description:</label>
            <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={event.description || ""}
                onChange={handleChange}
                disabled={!isOrganizer || startPassed}
            />
            <label htmlFor="location">Location:</label>
            <input
                type="text"
                id="location"
                name="location"
                placeholder="Location"
                value={event.location || ""}
                onChange={handleChange}
                disabled={!isOrganizer || startPassed}
            />
            <label htmlFor="startTime">Start Time:</label>
            <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                placeholder="Start Time"
                value={toDateTimeLocal(event.startTime)}
                onChange={handleChange}
                disabled={!isOrganizer || startPassed}
            />
            <label htmlFor="endTime">End Time:</label>
            <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                placeholder="End Time"
                value={toDateTimeLocal(event.endTime)}
                onChange={handleChange}
                disabled={!isOrganizer || endPassed}
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
                disabled={!isOrganizer || startPassed}
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
                disabled={!isManager}
            />
            <label htmlFor="published">Published:</label>
            <input
                type="checkbox"
                id="published"
                name="published"
                placeholder="Published"
                checked={event.published || false}
                onChange={handleCheckbox}
                disabled={!isManager}
            />
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                {isOrganizer && <button type="submit">Update</button>}
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default View;
