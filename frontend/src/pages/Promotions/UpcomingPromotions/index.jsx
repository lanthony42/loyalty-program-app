import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";
import { useNavigate } from "react-router-dom";

const UPCOMING_LIMIT = 4;
const FETCH_LIMIT = 20; 
const DATE_LOCALE = "en-US";
const DATE_OPTIONS = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
};

const UpcomingPromotions = () => {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();

  const fetchUpcomingPromotions = async () => {
    try {
      const url = `${config.backendUrl}/promotions?limit=${FETCH_LIMIT}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const now = new Date();

        const upcoming = data.results.filter(
          promo => new Date(promo.endTime) > now
        ).slice(0, UPCOMING_LIMIT); 

        setPromotions(upcoming);
      } else {
        console.error("Failed to fetch upcoming promotions");
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUpcomingPromotions();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <h3>Upcoming Promotions</h3>
      <div className="grid-container">
        {promotions.length === 0 ? (
          <p className="no-promotions">No upcoming promotions</p>
        ) : (
          promotions.map((promotion) => (
            <div key={promotion.id} className={`promotion-card ${promotion.type}`}>
              <div className="promotion-info">
                <h4 className="name">{promotion.name}</h4>
                <p><strong>Start:</strong> {new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.startTime))}</p>
                <p><strong>Ends:</strong> {new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.endTime))}</p>
                {<p><strong>Type:</strong> {promotion.type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")}</p>}
                {promotion.points && <p><strong>Points:</strong> {promotion.points}</p>}
                {promotion.rate && <p><strong>Rate:</strong> {promotion.rate}</p>}
              </div>
              <div className="promotion-section">
                <button onClick={() => navigate(`/promotions/${promotion.id}`)}>View</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingPromotions;
