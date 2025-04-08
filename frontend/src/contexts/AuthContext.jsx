import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "@/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authReady, setAuthReady] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            fetchUserData(storedToken);
        }
        else {
            setAuthReady(true);
            setToken(null);
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
                setToken(storedToken);
                setUser(data); 
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
            setToken(null);
            setUser(null);
        }
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

            if (response.ok) {
                const { token: storedToken } = await response.json();
                localStorage.setItem("token", storedToken);
                fetchUserData(storedToken);
                setToken(storedToken);

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
        localStorage.removeItem("token"); 
        setUser(null);

        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ authReady, token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
