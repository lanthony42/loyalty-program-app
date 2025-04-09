import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const View = () => {
    const [promotion, setPromotion] = useState(null);
    const [error, setError] = useState("");
    const { promotionId } = useParams();
    const { Role, authReady, user } = useAuth();
    const navigate = useNavigate();

    const fetchPromotionData = async () => {
        try {
            const url = `${config.backendUrl}/promotions/${promotionId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPromotion(data);
            }
            else if (response.status === 404) {
                navigate("/404");
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
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setPromotion({ ...promotion, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/promotions/${promotionId}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: promotion.name,
                    description: promotion.description,
                    type: promotion.type,
                    startTime: promotion.startTime,
                    endTime: promotion.endTime,
                    minSpending: promotion.minSpending,
                    rate: promotion.rate,
                    points: promotion.points,
                }),
            });

            if (response.ok) {
                alert("Promotion updated successfully");
                navigate(`/promotions/${promotion.id}`); 
            } else {
                const json = await response.json();
                setError(json.error);
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred while updating the promotion");
        }
    };

    const handleDelete = async (e) => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/promotions/${promotionId}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.token}`
                }
            });

            if (response.ok) {
                alert("Promotion deleted successfully");
                navigate(`/promotions`); 
            } else {
                const json = await response.json();
                setError(json.error);
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred while deleting the promotion");
        }
    };

    return !promotion ? (
        <p>Loading...</p>
    ) : (
        <>
            <h1>Update Promotion ID: {promotion.id}</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Name"
                    value={promotion.name || ""}
                    onChange={handleChange}
                />
                <label htmlFor="description">Description:</label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Description"
                    value={promotion.description || ""}
                    onChange={handleChange}
                />
                <label htmlFor="type">Type:</label>
                <select
                    id="type"
                    name="type"
                    value={promotion.type}
                    onChange={handleChange}
                >
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                </select>
                <label htmlFor="startTime">Start Time:</label>
                <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={promotion.startTime ? new Date(promotion.startTime).toISOString().slice(0, 16) : ""}
                    onChange={handleChange}
                />
                <label htmlFor="endTime">End Time:</label>
                <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={promotion.endTime ? new Date(promotion.endTime).toISOString().slice(0, 16) : ""}
                    onChange={handleChange}
                />
                <label htmlFor="minSpending">Minimum Spending:</label>
                <input
                    type="number"
                    id="minSpending"
                    name="minSpending"
                    placeholder="0"
                    value={promotion.minSpending || ""}
                    onChange={handleChange}
                />
                <label htmlFor="rate">Rate:</label>
                <input
                    type="number"
                    id="rate"
                    name="rate"
                    placeholder="0"
                    value={promotion.rate || ""}
                    onChange={handleChange}
                />
                <label htmlFor="points">Points:</label>
                <input
                    type="number"
                    id="points"
                    name="points"
                    placeholder="0"
                    value={promotion.points || ""}
                    onChange={handleChange}
                />
                <div className="btn-container">
                    <button type="button" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <button type="submit">Update</button>
                    <button type="button" onClick={handleDelete}>
                        Delete
                    </button>
                </div>
                <p className="error">{error}</p>
            </form>
        </>
    );
};

export default View;
