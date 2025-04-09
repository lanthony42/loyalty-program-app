import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "@/pages/Events/Card";
import config from "@/config";

const UpcomingEvents = ({ limit = 4 }) => {
    const [events, setEvents] = useState([]);
    const { user, authReady } = useAuth();

    useEffect(() => {
        if (user) {
            fetchUpcomingEvents();
        }
    }, [user]);

    const fetchUpcomingEvents = async () => {
        try {
            const url = `${config.backendUrl}/events`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch upcoming events");

            const data = await response.json();
            const now = new Date();

            const upcoming = data.results
                .filter(event => new Date(event.endTime) > now)
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .slice(0, limit);

            setEvents(upcoming);
        } catch (error) {
            console.error(error);
        }
    };

    if (!authReady) return <p>Loading...</p>;
    if (!user) return null;

    return (
        <div>
            <h3>Upcoming Events</h3>
            <div className="grid-container">
                {events.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
};

export default UpcomingEvents;
