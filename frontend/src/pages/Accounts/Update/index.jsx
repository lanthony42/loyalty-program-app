import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const UpdateUser = () => {
    const [updatingUser, setUpdatingUser] = useState(null);
    const [error, setError] = useState("");
    const { userId } = useParams();
    const { authReady, Role, user } = useAuth();
    const navigate = useNavigate();

    const fetchUserData = async () => {
        try {
            const url = `${config.backendUrl}/users/${userId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUpdatingUser(data);
            } else if (response.status === 404) {
                navigate("/404");
            } else {
                throw new Error("Failed to fetch user data");
            }
        } catch (error) {
            console.error(error);
        }
    };
    
    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    } else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleFieldChange = (e) => {
        const { name, value, type, checked } = e.target;        
        if (value === "") {
            setUpdatingUser((prevData) => ({
                ...prevData,
                [name]: null,
            }));
        }
        else {
            setUpdatingUser({
                ...updatingUser,
                [name]: type === "checkbox" ? checked : value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users/${updatingUser.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: updatingUser.email,
                    suspicious: updatingUser.suspicious,
                    verified: updatingUser.verified,
                    role: updatingUser.role,
                }),
            });

            if (response.ok) {
                alert("User updated successfully");
                navigate(`/users/${updatingUser.id}`);  // Redirect to the user's page
            } else {
                const json = await response.json();
                setError(json.error);
            }
        } catch (error) {
            console.error(error);
            setError("An error occurred while updating the user");
        }
    };

    return !updatingUser ? (
        <p>Loading...</p>
    ) : (
        <>
            <h1>Update User ID: {updatingUser.id}</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="utorid">UTORid:</label>
                <input
                    type="text"
                    id="utorid"
                    name="utorid"
                    placeholder="UTORid"
                    value={updatingUser.utorid || ""}
                    disabled
                />
                <label htmlFor="email">Email:</label>
                <input
                    type="text"
                    id="email"
                    name="email"
                    value={updatingUser.email || ""}
                    onChange={handleFieldChange}
                />
                <label htmlFor="role">Role:</label>
                <select
                    id="role"
                    name="role"
                    value={updatingUser.role}
                    onChange={handleFieldChange}
                    disabled={updatingUser.role === "superuser"}
                >
                    <option value="regular">Regular</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                </select>
                <label htmlFor="verified">Verified:</label>
                <input
                    type="checkbox"
                    id="verified"
                    name="verified"
                    checked={updatingUser.verified}
                    onChange={handleFieldChange}
                />
                <label htmlFor="suspicious">Suspicious:</label>
                <input
                    type="checkbox"
                    id="suspicious"
                    name="suspicious"
                    checked={updatingUser.suspicious}
                    onChange={handleFieldChange}
                />
                <div className="btn-container">
                    <button type="button" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <button type="submit">Update</button>
                </div>
                <p className="error">{error}</p>
            </form>
        </>
    );
};

export default UpdateUser;
