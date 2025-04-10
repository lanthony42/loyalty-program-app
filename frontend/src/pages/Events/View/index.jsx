import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const View = () => {
    const [event, setEvent] = useState(null);
    const [formError, setFormError] = useState("");
    const [organizer, setOrganizer] = useState("");
    const [organizerError, setOrganizerError] = useState("");
    const [guest, setGuest] = useState("");
    const [guestError, setGuestError] = useState("");
    const [pointsData, setPointsData] = useState({
        type: "event"
    });
    const [pointsError, setPointsError] = useState("");
    const { eventId } = useParams();
    const { Role, authReady, user, fetchUserData } = useAuth();
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
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
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
                setFormError("");
            }
            else {
                const json = await response.json();
                setFormError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setFormError("An error occurred while updating");
        }
    };

    const handleRSVP = async () => {
        try {
            const url = `${config.backendUrl}/events/${event.id}/guests/me`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
            });

            if (response.ok) {
                clickBack();
            }
            else {
                const json = await response.json();
                setFormError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setFormError("An error occurred while updating");
        }
    };

    const handleDelete = async () => {
        try {
            const url = `${config.backendUrl}/events/${event.id}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
            });

            if (response.ok) {
                clickBack();
            }
            else {
                const json = await response.json();
                setFormError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setFormError("An error occurred while updating");
        }
    };

    const changeOrganizer = e => {
        setOrganizer(e.target.value);
    };

    const addOrganizer = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/events/${event.id}/organizers`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ utorid: organizer }),
            });

            if (response.ok) {
                await fetchEventData();
                setOrganizerError("");
                setOrganizer("");
            }
            else {
                const json = await response.json();
                setOrganizerError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setOrganizerError("An error occurred while updating");
        }
    };

    const deleteOrganizer = async id => {
        try {
            const url = `${config.backendUrl}/events/${event.id}/organizers/${id}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
            });

            if (response.ok) {
                await fetchEventData();
                setOrganizerError("");
            }
            else {
                const json = await response.json();
                setOrganizerError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setOrganizerError("An error occurred while updating");
        }
    };

    const changeGuest = e => {
        setGuest(e.target.value);
    };

    const addGuest = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/events/${event.id}/guests`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ utorid: guest }),
            });

            if (response.ok) {
                await fetchEventData();
                setGuestError("");
                setGuest("");
            }
            else {
                const json = await response.json();
                setGuestError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setGuestError("An error occurred while updating");
        }
    };

    const deleteGuest = async id => {
        try {
            const url = `${config.backendUrl}/events/${event.id}/guests/${id}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
            });

            if (response.ok) {
                await fetchEventData();
                setGuestError("");
            }
            else {
                const json = await response.json();
                setGuestError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setGuestError("An error occurred while updating");
        }
    };

    const changeUtorId = e => {
        if (e.target.value) {
            setPointsData({
                ...pointsData,
                utorid: e.target.value
            });
        }
        else {
            setPointsData({
                ...pointsData,
                utorid: undefined
            });
        }
    };

    const changeAmount = e => {
        setPointsData({
            ...pointsData,
            amount: e.target.value
        });
    };

    const awardPoints = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/events/${event.id}/transactions`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(pointsData),
            });

            if (response.ok) {
                await fetchUserData(user.token);
                await fetchEventData();
                setPointsError("");
            }
            else {
                const json = await response.json();
                setPointsError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setPointsError("An error occurred while updating");
        }
    };

    return !event ? <p>Loading...</p> : <>
        <h1>Viewing Event {event.id}</h1>
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
            {isOrganizer && <>
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
            </>}
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                {isOrganizer && <button type="submit">Update</button>}
                {!isOrganizer && <button type="button" onClick={handleRSVP}>RSVP</button>}
                {isManager && !event.wasPublished && <button type="button" onClick={handleDelete}>Delete</button>}
            </div>
            <p className="error">{formError}</p>
        </form>
        {isManager && !endPassed && <>
            <h1>Add Organizers</h1>
            <form onSubmit={addOrganizer}>
                <label htmlFor="organizer">UTORid:</label>
                <input
                    type="text"
                    id="organizer"
                    name="organizer"
                    placeholder="UTORid"
                    value={organizer || ""}
                    onChange={changeOrganizer}
                    required
                />
                <div className="btn-container">
                    <button type="submit">Add Organizer</button>
                </div>
                <p className="error">{organizerError}</p>
            </form>
            <div className="grid-container box">
                {event.organizers.map(o => <div key={o.id} className="card event">
                    <div className="card-content">
                        <h4>{o.utorid} (ID: {o.id})</h4>
                        <p><strong>Name:</strong> {o.name}</p>
                    </div>
                    <div className="btn-container">
                        <button type="button" onClick={() => deleteOrganizer(o.id)}>Delete</button>
                    </div>
                </div>)}
            </div>
        </>}
        {isOrganizer && !endPassed && <>
            <h1>Add Guests</h1>
            <form onSubmit={addGuest}>
                <label htmlFor="guest">UTORid:</label>
                <input
                    type="text"
                    id="guest"
                    name="guest"
                    placeholder="UTORid"
                    value={guest || ""}
                    onChange={changeGuest}
                    required
                />
                <div className="btn-container">
                    <button type="submit">Add Guest</button>
                </div>
                <p className="error">{guestError}</p>
            </form>
            {isManager && <div className="grid-container box">
                {event.guests.map(g => <div key={g.id} className="card event">
                    <div className="card-content">
                        <h4>{g.utorid} (ID: {g.id})</h4>
                        <p><strong>Name:</strong> {g.name}</p>
                    </div>
                    <div className="btn-container">
                        <button type="button" onClick={() => deleteGuest(g.id)}>Delete</button>
                    </div>
                </div>)}
            </div>}
        </>}
        {isOrganizer && <>
            <div className="center-text">
                <h1>Award Points</h1>
                <p>Points Remaining: {event.pointsRemain}</p>
            </div>
            <form onSubmit={awardPoints}>
                <label htmlFor="utorid">UTORid:</label>
                <select
                    id="utorid"
                    name="utorid"
                    placeholder="UTORid"
                    value={pointsData.utorid || ""}
                    onChange={changeUtorId}
                >
                    <option value="">All Guests</option>
                    {event.guests.map(g => <option key={g.id} value={g.utorid}>
                        {g.utorid}
                    </option>)}
                </select>
                <label htmlFor="amount">Amount:</label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="Amount"
                    min="1"
                    step="1"
                    value={pointsData.amount || ""}
                    onChange={changeAmount}
                    required
                />
                <div className="btn-container">
                    <button type="submit">Award Points</button>
                </div>
                <p className="error">{pointsError}</p>
            </form>
        </>}
    </>;
};

export default View;
