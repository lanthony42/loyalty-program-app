import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "@/config";

const AuthContext = createContext(null);

const Role = {
    regular: 0,
    cashier: 1,
    manager: 2,
    superuser: 3
};

export const AuthProvider = ({ children }) => {
    const [authReady, setAuthReady] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            fetchUserData(storedToken);
        }
        else {
            setAuthReady(true);
            setUser(null);
        }
    }, []);

    const fetchUserData = async storedToken => {
        try {
            const url = `${config.backendUrl}/users/me`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${storedToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAuthReady(true);
                setUser({
                    ...data,
                    role: getRole() || data.role,
                    token: storedToken,
                    baseRole: data.role
                });
            }
            else {
                throw new Error("Failed to fetch user data");
            }
        }
        catch (error) {
            console.error(error);

            // Clear data on error
            localStorage.removeItem("token");
            setAuthReady(true);
            setUser(null);
        }
    };

    const getRole = () => {
        const role = localStorage.getItem("role");
        if (Role[role] != null) {
            return role;
        }
    };

    const setRole = role => {
        if (Role[role] > Role[user.baseRole]) {
            role = user.baseRole;
        }
        localStorage.setItem("role", role);
        setUser({
            ...user,
            role
        });
    };

    const login = async (utorid, password) => {
        try {
            const url = `${config.backendUrl}/auth/tokens`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ utorid, password }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                await fetchUserData(data.token);

                navigate("/dashboard");
            }
            else {
                return data.message;
            }
        }
        catch (error) {
            console.error(error);
            return "An error occurred while logging in";
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);

        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ Role, authReady, user, fetchUserData, setRole, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
