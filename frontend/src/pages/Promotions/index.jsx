import "@/pages/main.css";
import "./style.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const PAGE_LIMIT = 4;

const Promotions = () => {
    const navigate = useNavigate();
    const [promotions, setPromotions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { authReady, user } = useAuth();

    const query = useMemo(() => {
        return {
            page: parseInt(searchParams.get("page")) || 1,
            name: searchParams.get("name") || "",
            type: searchParams.get("type") || ""
        };
    }, [searchParams]);

    const fetchPromotionData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = `${config.backendUrl}/promotions?${params}&limit=${PAGE_LIMIT}`; // Make sure to include limit in the API call
        
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
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT)); // Correctly calculate total pages
            }
            else {
                throw new Error("Failed to fetch promotion data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPromotionData();
        }
    }, [user, query]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const changeFilter = e => {
        const { name, value } = e.target;
        setSearchParams(params => {
            if (value) {
                searchParams.set(name, value);
            }
            else {
                searchParams.delete(name);
            }
            searchParams.set("page", 1); // Reset to page 1 when filters change
            return params;
        });
    };

    const changePage = newPage => {
        setSearchParams(params => {
            params.set("page", newPage); // Change page
            return params;
        });
    };

    return (
        <div>
            <div className="header-container">
                <h1>Promotions</h1>
                {["manager", "superuser"].includes(user.role) && (
                    <div className="btn-container" id="create-button">
                        <button onClick={() => navigate("/promotions/create")}>Create New Promotion</button>
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
                    return (
                        <div key={promotion.id} className="promotion-card">
                            <div className="promotion-info">
                                <h4>Promotion ID: {promotion.id}</h4>
                                {<h4 className="name">{promotion.name}</h4>}
                                {<p><strong>Type:</strong> {promotion.type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("-")}</p>}
                                {<p><strong>End Time:</strong> {new Date(promotion.endTime).toLocaleDateString("en-CA", {year: "numeric", month: "long",day: "numeric",})}</p>}
                                {<p><strong>Minimum Spending:</strong> {promotion.minSpending ?? 0}</p>}
                                {<p><strong>Rate:</strong> {promotion.rate ?? 0}</p>}
                                {<p><strong>Points:</strong> {promotion.points ?? 0}</p>}
                            </div>
                            <div className="promotion-section">
                                {["manager", "superuser"].includes(user.role) && (
                                    <div className="btn-container" id="update-user-button">
                                        <button onClick={() => navigate(`/promotions/${promotion.id}`)}>View</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
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

                <span>Page {query.page} of {totalPages}</span>
            
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
