import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const View = () => {
    const [promotion, setPromotion] = useState(null);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const { promotionId } = useParams();
    const { Role, authReady, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
                setPromotion({
                    ...data,
                    startPassed: new Date() >= new Date(data.startTime),
                    endPassed: new Date() >= new Date(data.endTime)
                });
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
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    const toDateTimeLocal = time => {
        if (!time) {
            return "";
        }

        const date = new Date(time);
        const pad = n => String(n).padStart(2, "0");

        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        if (value === "") {
            setPromotion((prevData) => ({
                ...prevData,
                [name]: null,
            }));
        }
        else {
            setPromotion({ ...promotion, [name]: value });
        }
    };

    const clickBack = () => {
        if (location.state?.fromSite) {
            navigate(-1);
        }
        else {
            navigate('/promotions');
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        const data = { ...promotion };
        if (data.startPassed) {
            for (const key of ["name", "description", "type", "startTime", "minSpending", "rate", "points"]) {
                data[key] = undefined;
            }
        }
        if (data.endPassed) {
            data.endTime = undefined;
        }

        try {
            const url = `${config.backendUrl}/promotions/${promotionId}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                await fetchPromotionData();
                setSuccess("Promotion successfully updated");
                setError("");
            }
            else {
                const json = await response.json();
                setError(json.error);
                setSuccess("");
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while updating the promotion");
            setSuccess("");
        }
    };

    const handleDelete = async e => {
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
                clickBack();
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while deleting the promotion");
        }
    };

    return !promotion ? (
        <p>Loading...</p>
    ) : (
        <>
            <h1>Viewing Promotion {promotion.id}</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="name">Name:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Name"
                    value={promotion.name || ""}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <label htmlFor="description">Description:</label>
                <textarea
                    id="description"
                    name="description"
                    placeholder="Description"
                    value={promotion.description || ""}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <label htmlFor="type">Type:</label>
                <select
                    id="type"
                    name="type"
                    value={promotion.type}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                >
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                </select>
                <label htmlFor="startTime">Start Time:</label>
                <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    placeholder="Start Time"
                    value={toDateTimeLocal(promotion.startTime)}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <label htmlFor="endTime">End Time:</label>
                <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    placeholder="End Time"
                    value={toDateTimeLocal(promotion.endTime)}
                    onChange={handleChange}
                    disabled={promotion.endPassed}
                />
                <label htmlFor="minSpending">Minimum Spending:</label>
                <input
                    type="number"
                    id="minSpending"
                    name="minSpending"
                    placeholder="0"
                    value={promotion.minSpending || ""}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <label htmlFor="rate">Rate:</label>
                <input
                    type="number"
                    id="rate"
                    name="rate"
                    placeholder="0"
                    value={promotion.rate || ""}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <label htmlFor="points">Points:</label>
                <input
                    type="number"
                    id="points"
                    name="points"
                    placeholder="0"
                    value={promotion.points || ""}
                    onChange={handleChange}
                    disabled={promotion.startPassed}
                />
                <div className="btn-container">
                    <button type="button" onClick={clickBack}>
                        Back
                    </button>
                    {!promotion.endPassed && <button type="submit">Update</button>}
                    {!promotion.startPassed && <button type="button" onClick={handleDelete}>
                        Delete
                    </button>}
                </div>
                {success ? <p className="success">{success}</p> : <p className="error">{error}</p>}
            </form>
        </>
    );
};

export default View;
