import "@/pages/main.css";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const PAGE_LIMIT = 10;

const Users = () => {
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

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }
    else if (user.role == "regular") {
        return <Navigate to="/dashboard" replace />;
    }

    const fetchUserData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = `${config.backendUrl}/users?${params}`;
        
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
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT));
            }
            else {
                throw new Error("Failed to fetch user data");
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
            <h1>Users</h1>
            <div>
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
            <ul>
                {users.map(user => (
                    <li key={user.id} style={{ marginBottom: "1rem" }}>
                        <ul>
                            {Object.entries(user).map(([key, value]) => (
                                <li key={key}>
                                    <strong>{key}</strong>: {typeof value === "object" && value !== null
                                        ? JSON.stringify(value)
                                        : String(value)}
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
            <div>
                <button
                    onClick={() => changePage(query.page - 1)}
                    disabled={query.page === 1}
                >
                    Previous
                </button>
                <span>Page {query.page} of {totalPages}</span>
                <button
                    onClick={() => changePage(query.page + 1)}
                    disabled={query.page === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
      );
};

export default Users;
