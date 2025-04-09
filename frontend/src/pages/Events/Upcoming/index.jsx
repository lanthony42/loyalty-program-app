import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const DATE_LOCALE = "en-US";
const DATE_OPTIONS = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
};

const Upcoming = ({ limit = 4 }) => {
    const [events, setEvents] = useState([]);
    const { Role, user } = useAuth();
    const isManager = Role[user.role] >= Role.manager;

    useEffect(() => {
        if (user) {
            fetchUpcomingEvents();
        }
    }, [user]);

    const fetchUpcomingEvents = async () => {
        try {
            const url = `${config.backendUrl}/events?ended=false&showFull=true`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.results.slice(0, limit));
            }
            else {
                throw new Error("Failed to fetch upcoming events");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    return !events ? null : <div>
        <h1>Upcoming Events</h1>
        <div className="grid-container">
            {events.map(event => {
                const prettyStart = new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(event.startTime));
                return <div key={event.id} className="card event">
                    <div className="card-content">
                        <h4>{event.name} (ID: {event.id})</h4>
                        <p>
                            <strong>Location:</strong> {event.location}
                        </p>
                        <p>
                            <strong>Start Time:</strong> {prettyStart}
                        </p>
                        {isManager && <p>
                            <strong>Published:</strong> {event.published ? "Yes" : "No"}
                        </p>}
                    </div>
                    <div className="btn-container">
                        <Link to={`/events/${event.id}`} state={{ fromSite: true }}>View</Link>
                    </div>
                </div>
            })}
        </div>
    </div>;
};

export default Upcoming;
