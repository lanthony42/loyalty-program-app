import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const DATE_LOCALE = "en-US";
const DATE_OPTIONS = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
};

const Card = ({ event }) => {
    const { Role, user } = useAuth();
    const isManager = Role[user.role] >= Role.manager;
    const prettyStart = new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(event.startTime));
    const prettyEnd = new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(event.endTime));

    return <>
        <div className="card event">
            <div className="card-content">
                <h4>{event.name} (ID: {event.id})</h4>
                <p>
                    <strong>Location:</strong> {event.location}
                </p>
                <p>
                    <strong>Start Time:</strong> {prettyStart}
                </p>
                <p>
                    <strong>End Time:</strong> {prettyEnd}
                </p>
                {event.capacity != null && <p>
                    <strong>Capacity:</strong> {event.capacity}
                </p>}
                {event.numGuests != null && <p>
                    <strong>Number of Guests:</strong> {event.numGuests}
                </p>}
                {isManager && <p>
                    <strong>Points Remain:</strong> {event.pointsRemain}
                </p>}
                {isManager && <p>
                    <strong>Points Awarded:</strong> {event.pointsAwarded}
                </p>}
                {isManager && <p>
                    <strong>Published:</strong> {event.published ? "Yes" : "No"}
                </p>}
            </div>
            <div className="btn-container">
                <Link to={`/events/${event.id}`} state={{ fromSite: true }}>View</Link>
            </div>
        </div>
    </>;
};

export default Card;
