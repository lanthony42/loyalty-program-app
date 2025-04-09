import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Manage = () => {
    const [event, setEvent] = useState(null);
    const [organizer, setOrganizer] = useState("");
    const [organizerError, setOrganizerError] = useState("");
    const [guest, setGuest] = useState("");
    const [guestError, setGuestError] = useState("");
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
                setEvent(data);
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

    const changeOrganizer = e => {
        setOrganizer(e.target.value);
    };

    const changeGuest = e => {
        setGuest(e.target.value);
    };

    const clickBack = () => {
        if (location.state?.fromSite) {
            navigate(-1);
        }
        else {
            navigate('/events');
        }
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

    return !event ? <p>Loading...</p> : <>
        <h1>Managing Event {event.id}</h1>
        {isManager && <>
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
                    <button type="button" onClick={clickBack}>Back</button>
                    <button type="submit">Add</button>
                </div>
                <p className="error">{organizerError}</p>
            </form>
            <div className="grid-container">
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
                <button type="button" onClick={clickBack}>Back</button>
                <button type="submit">Add</button>
            </div>
            <p className="error">{guestError}</p>
        </form>
        {isManager && <div className="grid-container">
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
    </>;
};

export default Manage;
