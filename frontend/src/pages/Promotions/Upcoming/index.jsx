import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const [promotions, setPromotions] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchUpcomingPromotions();
        }
    }, [user]);

    const fetchUpcomingPromotions = async () => {
        try {
            const url = `${config.backendUrl}/promotions?ended=false`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPromotions(data.results.slice(0, limit));
            }
            else {
                throw new Error("Failed to fetch upcoming promotions");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    return !promotions ? null : <div>
        <h1>Upcoming Promotions</h1>
        <div className="grid-container">
            {promotions.map(promotion => {
                const prettyStart = promotion.startTime ? new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.startTime)) : "";
                const prettyEnd = new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.endTime));
                return <div key={promotion.id} className={`card ${promotion.type}`}>
                    <div className="card-content">
                        <h4 className="name">{promotion.name} (ID: {promotion.id})</h4>
                        <p><strong>Start Time:</strong> {prettyStart}</p>
                        <p><strong>End Time:</strong> {prettyEnd}</p>
                        <p><strong>Type:</strong> {promotion.type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")}</p>
                    </div>
                    <div className="btn-container">
                        <button onClick={() => navigate(`/promotions/${promotion.id}`, { state: { fromSite: true } })}>View</button>
                    </div>
                </div>
            })}
        </div>
    </div>;
};

export default Upcoming;
