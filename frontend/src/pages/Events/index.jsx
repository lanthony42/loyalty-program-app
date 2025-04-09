import "@/pages/main.css";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import EventCard from "./Card";
import config from "@/config";

const PAGE_LIMIT = 4;

const Events = () => {
    const [events, setEvents] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { Role, authReady, user } = useAuth();

    const query = useMemo(() => {
        return {
            limit: PAGE_LIMIT,
            page: parseInt(searchParams.get("page")) || 1,
            name: searchParams.get("name") || "",
            location: searchParams.get("location") || "",
            started: searchParams.get("started") || "",
            ended: searchParams.get("ended") || "",
            showFull: searchParams.get("showFull") || "false",
            published: searchParams.get("published") || ""
        };
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchEventData();
        }
    }, [user, query]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;

    const fetchEventData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = `${config.backendUrl}/events?${params}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.results);
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT));
            }
            else {
                throw new Error("Failed to fetch event data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    const changeFilter = e => {
        const { name, value } = e.target;
        setSearchParams(params => {
            if (value) {
                searchParams.set(name, value);

                // Clear dependant parameters
                if (name === "started") {
                    searchParams.delete("ended");
                }
                else if (name === "ended") {
                    searchParams.delete("started");
                }
            }
            else {
                searchParams.delete(name);
            }
            searchParams.set("page", 1);
            return params;
        });
    };

    const changePage = newPage => {
        setSearchParams(params => {
            params.set("page", newPage);
            return params;
        });
    };

    return <div>
        <div className="header-container">
            <h1>Events</h1>
            <div className="btn-container">
                {isManager && <Link to="/events/create">Create New</Link>}
            </div>
        </div>

        <div className="filter-container">
            <input
                name="name"
                value={query.name}
                placeholder="Name"
                onChange={changeFilter}
            />
            <input
                name="location"
                value={query.location}
                placeholder="Location"
                onChange={changeFilter}
            />
            <select
                name="started"
                value={query.started}
                onChange={changeFilter}
            >
                <option value="">Started?</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>
            <select
                name="ended"
                value={query.ended}
                onChange={changeFilter}
            >
                <option value="">Ended?</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>
            <select
                name="showFull"
                value={query.showFull}
                onChange={changeFilter}
            >
                <option value="true">Show All</option>
                <option value="false">Available Only</option>
            </select>
            {isManager && <>
                <select
                    name="published"
                    value={query.published}
                    onChange={changeFilter}
                >
                    <option value="">Published?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </>}
        </div>
        <div className="grid-container">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
        <div className="pagination-container">
            <div className="btn-container">
                <button
                    onClick={() => changePage(query.page - 1)}
                    disabled={query.page === 1}
                >
                    Previous
                </button>
            </div>
            <span>Page {Math.min(query.page, totalPages)} of {totalPages}</span>
            <div className="btn-container">
                <button
                    onClick={() => changePage(query.page + 1)}
                    disabled={query.page === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    </div>;
};

export default Events;
