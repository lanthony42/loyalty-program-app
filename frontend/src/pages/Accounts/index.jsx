import "@/pages/main.css";
import "@/pages/card.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const PAGE_LIMIT = 4;
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { Role, authReady, user } = useAuth();

    const query = useMemo(() => {
        return {
            page: parseInt(searchParams.get("page")) || 1,
            name: searchParams.get("name") || "",
            role: searchParams.get("role") || "",
            verified: searchParams.get("verified") || "",
            activated: searchParams.get("activated") || ""
        };
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user, query]);

    const fetchUserData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = `${config.backendUrl}/users?${params}&limit=${PAGE_LIMIT}`; // Make sure to include limit in the API call

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data.results);
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT)); // Correctly calculate total pages
            }
            else {
                throw new Error("Failed to fetch user data");
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
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
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
                <h1>Users</h1>
                <div className="btn-container">
                    <button onClick={() => navigate("/register", { state: { fromSite: true } })}>Register New User</button>
                </div>
            </div>
            <div className="filter-container">
                <input
                    name="name"
                    value={query.name}
                    placeholder="Name or UTORid"
                    onChange={changeFilter}
                />
                <select
                    name="role"
                    value={query.role}
                    onChange={changeFilter}
                >
                    <option value="">Select Role</option>
                    <option value="regular">Regular</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                </select>
                <select
                    name="verified"
                    value={query.verified}
                    onChange={changeFilter}
                >
                    <option value="">Verified?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
                <select
                    name="activated"
                    value={query.activated}
                    onChange={changeFilter}
                >
                    <option value="">Activated?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>

            <div className="grid-container">
                {users.map(user => {
                    const avatarUrl = user?.avatarUrl ? `${config.backendUrl}${user?.avatarUrl}` : DEFAULT_AVATAR;
                    return (
                        <div key={user.id} className={`card ${user.role}`}>
                            <div className="card-content">
                                <h4>{user.utorid} (ID: {user.id})</h4>
                                {user.name && <p><strong>Name:</strong> {user.name}</p>}
                                {user.email && <p><strong>Email:</strong> {user.email}</p>}
                                {user.birthday && <p><strong>Birthday:</strong> {user.birthday}</p>}
                                {user.role && <p><strong>Role:</strong> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>}
                                {user.points != null && <p><strong>Points:</strong> {user.points}</p>}
                                {user.verified != null && <p><strong>Verified:</strong> {user.verified ? "Yes" : "No"}</p>}
                            </div>
                            <div className="user-avatar-section">
                                <div className="btn-container">
                                    <button onClick={() => navigate(`/users/${user.id}`, { state: { fromSite: true } })}>View</button>
                                </div>
                                <img
                                    src={avatarUrl}
                                    alt={`${user.name}'s Avatar`}
                                    className="user-avatar"
                                />
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

export default Users;
