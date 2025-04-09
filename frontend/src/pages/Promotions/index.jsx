import "@/pages/main.css";
import "@/pages/card.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const PAGE_LIMIT = 4;
const DATE_LOCALE = "en-US";
const DATE_OPTIONS = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
};

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { Role, authReady, user } = useAuth();
    const navigate = useNavigate();

    const query = useMemo(() => {
        return {
            page: parseInt(searchParams.get("page")) || 1,
            name: searchParams.get("name") || "",
            type: searchParams.get("type") || ""
        };
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchPromotionData();
        }
    }, [user, query]);

    const fetchPromotionData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = `${config.backendUrl}/promotions?${params}&limit=${PAGE_LIMIT}`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPromotions(data.results);
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT));
            }
            else {
                throw new Error("Failed to fetch promotion data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;

    const changeFilter = e => {
        const { name, value } = e.target;
        setSearchParams(params => {
            if (value) {
                searchParams.set(name, value);
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

    return (
        <div>
            <div className="header-container">
                <h1>Promotions</h1>
                {isManager && (
                    <div className="btn-container" id="create-button">
                        <button onClick={() => navigate("/promotions/create", { state: { fromSite: true } })}>Create New Promotion</button>
                    </div>
                )}
            </div>
            <div className="filter-container">
                <input
                    name="name"
                    value={query.name}
                    placeholder="Name"
                    onChange={changeFilter}
                />
                <select
                    name="type"
                    value={query.type}
                    onChange={changeFilter}
                >
                    <option value="">Select Type</option>
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                </select>
            </div>

            <div className="grid-container">
                {promotions.map(promotion => {
                    const prettyStart = isManager ? new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.startTime)) : "";
                    const prettyEnd = new Intl.DateTimeFormat(DATE_LOCALE, DATE_OPTIONS).format(new Date(promotion.endTime));
                    return <div key={promotion.id} className={`card ${promotion.type}`}>
                        <div className="card-content">
                            <h4>{promotion.name} (ID: {promotion.id})</h4>
                            <p><strong>Type:</strong> {promotion.type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")}</p>
                            {isManager && <p><strong>Start Time:</strong> {prettyStart}</p>}
                            <p><strong>End Time:</strong> {prettyEnd}</p>
                            <p><strong>Minimum Spending:</strong> {promotion.minSpending || 0}</p>
                            <p><strong>Rate:</strong> {promotion.rate || 0}</p>
                            <p><strong>Points:</strong> {promotion.points || 0}</p>
                        </div>
                        <div className="btn-container">
                            {isManager && <button onClick={() => navigate(`/promotions/${promotion.id}`, { state: { fromSite: true } })}>View</button>}
                        </div>
                    </div>;
                })}
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
        </div>
    );
};

export default Promotions;
